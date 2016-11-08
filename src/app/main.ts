import * as Electron from "electron";
import JSX from "./jsx";
import * as rx from "rxjs";
import * as Cycle from "@cycle/rxjs-run";
import {makeDOMDriver, VNode, div, button, canvas, span} from "@cycle/dom";
import {DOMSource} from "@cycle/dom/rxjs-typings";
import {Intents, Intent} from "./intent";
import {MESSAGE} from "../ipc2";
import * as _ from "lodash";
import isolate from "@cycle/isolate";

type Sources = {
  DOM: DOMSource;
  electron: rx.Observable<ElectronMessage>;
}

interface DomSink {
  DOM: rx.Observable<VNode>;
}

interface MainSink extends DomSink {
  electron: rx.Observable<ElectronMessage>;
}

interface MenuSink extends DomSink {
  DOM: rx.Observable<VNode>;
  opens: rx.Observable<ElectronMessage>;
}

function menu(sources: {DOM: DOMSource}): MenuSink {
  let fileOpens = sources.DOM.select(".file").events("click").map(() => ({
    name: MESSAGE.toHost.OpenFile,
    data: [],
  }));
  let folderOpens = sources.DOM.select(".folder").events("click").map(() => ({
    name: MESSAGE.toHost.OpenFolder,
    data: [],
  }));

  return {
    opens: rx.Observable.merge(fileOpens, folderOpens),
    DOM: rx.Observable.of(
      div(".top-menu", [
        button(".file", "Select File"),
        button(".folder", "Select Folder"),
      ])
    )
  };
}

interface ElectronMessage {
  name: string;
  data: any[];
}

function makeElectronDriver(eventNames: Array<string>) {
  function driver(outgoingMessages: rx.Observable<ElectronMessage>): rx.Observable<ElectronMessage> {
    function onNext(msg: ElectronMessage) {
      console.log("Sending message to host", msg);
      Electron.ipcRenderer.send(msg.name, ...msg.data);
    }
    outgoingMessages.subscribe({
      next: onNext,
      error: (...args: any[]) => console.error("Electron driver error occurred. ", ...args),
      complete: () => {},
    });

    // Create event streams for all names passed into the driver.
    let source = rx.Observable.merge(...eventNames.map(name =>
      rx.Observable.fromEvent(
        Electron.ipcRenderer,
        name,
        (...data) => ({name: name, data: data}))
    ));

    source.forEach(({name, data}) => console.log("guest got", name, data));
    return source;
  }
  return driver;
}

interface RendererSources {
  DOM: DOMSource;
  pages: rx.Observable<string>;
}
interface RendererSink {
  DOM: rx.Observable<VNode>;
  actions: {
    nextPage: rx.Observable<MouseEvent>;
    prevPage: rx.Observable<MouseEvent>;
    nextChapter: rx.Observable<MouseEvent>;
    prevChapter: rx.Observable<MouseEvent>;
  };
}
function renderer(sources: RendererSources): RendererSink {
  sources.DOM.select("button").events("click").forEach(() => console.log("Button clicked"));
  // Action streams
  let actions = {
    nextPage: sources.DOM.select(".next-page").events("click"),
    prevPage: sources.DOM.select(".previous-page").events("click"),
    nextChapter: sources.DOM.select(".next-chapter").events("click"),
    prevChapter: sources.DOM.select(".previous-chapter").events("click"),
  };
  return {
    actions: actions,
    DOM: rx.Observable.of(
      div(".viewport", [
        div(".image-container", [
          canvas(),
        ]),
        div(".bottom-menu", [
          button(".previous-chapter", "Previous Chapter"),
          button(".previous-page", "Previous Page"),
          span("", "some text"),
          button(".next-page", "Next Page"),
          button(".next-chapter", "Next Chapter"),
        ])
      ])
    )
  };
}

function main(sources: Sources): MainSink {
  let topMenu = isolate(menu)(sources);
  let viewport = isolate(renderer)({DOM: sources.DOM, pages: rx.Observable.never()});
  let sinks = {
    DOM: rx.Observable.combineLatest(topMenu.DOM, viewport.DOM).map(([menu, viewport]) => {
      return div(".application", [
        menu,
        viewport
      ]);
    }),
    electron: topMenu.opens,
  };

  return sinks;
}


function bootstrap() {
  console.log("Hello from bootstrap!");

  let drivers = {
    DOM: makeDOMDriver("#root"),
    electron: makeElectronDriver(_.values(MESSAGE.toGuest))
  };

  // returns a function, dunno what it does.
  Cycle.run(main, drivers);
}

export default function init() {
  document.addEventListener("DOMContentLoaded", bootstrap);
}
