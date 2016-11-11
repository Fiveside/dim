import * as Electron from "electron";
import * as rx from "rxjs";

export type ElectronIPCStream = rx.Observable<ElectronIPCMessage>;
interface ElectronIPCMessage {
  name: string;
  data: any[];
}

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
    let sourceMulticast = new rx.Subject();
    let sourceUnicast = rx.Observable.merge(...eventNames.map(name =>
      rx.Observable.fromEvent(
        Electron.ipcRenderer,
        name,
        (event, ...data) => ({name: name, data: data}))
    ));
    let source = sourceUnicast.multicast(sourceMulticast);
    source.connect();

    source.forEach(({name, data}) => console.log("guest got", name, data));
    return source;
  }
  return driver;
}

export function createIPCMessage(name: string, ...args: any[]): ElectronIPCMessage {
  return {
    name: name,
    data: args,
  };
}
