import * as Electron from "electron";
import * as rx from "rxjs";
import {toMulticast} from "../util";
import {VirtualCollection} from "../vfs";
import {VNode, h} from "@cycle/dom";

export type ElectronIPCStream = rx.Observable<ElectronIPCMessage>;
interface ElectronIPCMessage {
  name: string;
  data: any[];
}

// The IPC driver accepts messages to send to the host process and listens
// to specified events from the host process (async communication).
export function makeElectronIPCDriver(eventNames: Array<string>) {
  function driver(outgoingMessages: ElectronIPCStream): ElectronIPCStream {
    function onNext(msg: ElectronIPCMessage) {
      console.log("Sending message to host", msg);
      Electron.ipcRenderer.send(msg.name, ...msg.data);
    }
    outgoingMessages.subscribe({
      next: onNext,
      error: (...args: any[]) => console.error("Electron driver error occurred. ", ...args),
      complete: () => {},
    });

    // Create event streams for all names passed into the driver.
    // Wish there was a nice way of just multicasting to a new subject.
    let source = toMulticast(rx.Observable.merge(...eventNames.map(name =>
      rx.Observable.fromEvent(
        Electron.ipcRenderer,
        name,
        (event, ...data) => createIPCMessage(name, ...data))
    )));

    source.forEach(({name, data}) => console.log("guest got", name, data));
    return source;
  }
  return driver;
}

// Same function interface as EventEmitter.emit.
// Generates a message for the driver (or coming from the driver).
export function createIPCMessage(name: string, ...args: any[]): ElectronIPCMessage {
  return {
    name: name,
    data: args,
  };
}

export interface CanvasRenderSource {
  vtree: VNode;
  canvas: rx.Observable<HTMLCanvasElement>;
}

// The canvas driver provides a vdom and a canvas rx
// It accepts an rx of layouts for resizing purposes.
export function makeCanvasRenderDriver() {
  function driver(layouts: rx.Observable<string>): CanvasRenderSource {
    let canvasCache = new rx.ReplaySubject<HTMLCanvasElement>(1);
    let vtree = h("canvas", {
      hook: {insert: (x: VNode) => canvasCache.next(<HTMLCanvasElement>x.elm)}
    }, []);

    return <CanvasRenderSource>{
      vtree: vtree,
      canvas: canvasCache
    };
  }
  return driver;
}
