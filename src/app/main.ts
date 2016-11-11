import * as Electron from "electron";
import * as rx from "rxjs";
import * as Cycle from "@cycle/rxjs-run";
import {makeDOMDriver, VNode, div, button, span} from "@cycle/dom";
import {DOMSource} from "@cycle/dom/rxjs-typings";
import {model, Actions, AppState} from "./model";
import {MESSAGE} from "../ipc";
import * as _ from "lodash";
import * as Drivers from "./drivers";

type Sources = {
  DOM: DOMSource;
  electron: Drivers.ElectronIPCStream;
  canvas: Drivers.CanvasRenderSource;
}

interface MainSink {
  DOM: rx.Observable<VNode>;
  electron: Drivers.ElectronIPCStream;
  title: rx.Observable<string>;
}

function intent(sources: Sources): {actions: Actions, sinks: {electron: Drivers.ElectronIPCStream}} {
  let fileOpens = sources.DOM.select(".file").events("click").map(() =>
    Drivers.createIPCMessage(MESSAGE.toHost.OpenFile));
  let folderOpens = sources.DOM.select(".folder").events("click").map(() =>
    Drivers.createIPCMessage(MESSAGE.toHost.OpenFolder));

  function efilter(electron: Drivers.ElectronIPCStream, name: string): Drivers.ElectronIPCStream {
    return electron.filter(x => x.name === name);
  }
  function etranslate(electron: Drivers.ElectronIPCStream, name: string): rx.Observable<any> {
    return efilter(electron, name).map(x => x.data[0]);
  }

  let actions: Actions = {
    nextPage: sources.DOM.select(".next-page").events("click"),
    prevPage: sources.DOM.select(".previous-page").events("click"),
    setPage: rx.Observable.never(),
    nextChapter: sources.DOM.select(".next-chapter").events("click"),
    prevChapter: sources.DOM.select(".previous-chapter").events("click"),
    openFile: etranslate(sources.electron, MESSAGE.toGuest.OpenFile),
    openFolder: etranslate(sources.electron, MESSAGE.toGuest.OpenFolder),
    closeChapter: efilter(sources.electron, MESSAGE.toGuest.CloseFile),
    setLayout: rx.Observable.never(),
    isFullscreenChange: etranslate(sources.electron, MESSAGE.toGuest.Fullscreen),
  };

  return {
    actions: actions,
    sinks: {
      electron: fileOpens.merge(folderOpens)
    },
  };
}

function view(data: AppState, sources: Sources): {DOM: rx.Observable<VNode>} {
  let totalPages = rx.Observable.of(null).merge(data.chapter.map(x => x.length));
  let doctoredPage = rx.Observable.of(null).merge(data.currentPage);
  let merged = rx.Observable.combineLatest(
    data.openFile,
    doctoredPage,
    totalPages,
    data.isFullscreen,
  );
  let withPrefix = rx.Observable.of([
    null, null, null, false,
  ]).merge(merged);
  return {
    DOM: withPrefix.map(([openfile, currentPage, totalPages, isFullscreen]) => {
      let inner: VNode;
      if (openfile == null) {
        inner = div(".top-menu", [
          button(".file", "Select File"),
          button(".folder", "Select Folder"),
        ]);
      } else {
        inner = div(".viewport", [
          div(".image-container", [
            sources.canvas.vtree,
          ]),
          div(".bottom-menu", [
            button(".previous-chapter", "Previous Chapter"),
            button(".previous-page", "Previous Page"),
            span("", `Page ${currentPage + 1} of ${totalPages}`),
            button(".next-page", "Next Page"),
            button(".next-chapter", "Next Chapter"),
          ])
        ]);
      }
      let isfs = isFullscreen ? ".fullscreen" : "";
      return div(".application" + isfs, [inner]);
    })
  };
}

function main(sources: Sources): MainSink {
  let intents = intent(sources);
  let actions = intents.actions;
  let intentSinks = intents.sinks;

  let data = model(actions);
  let vdom = view(data, sources);

  // Paint on the canvas.
  rx.Observable.combineLatest(
    data.layout, data.currentPage, data.chapter, sources.canvas.canvas,
  ).forEach(([layout, pageNum, chapter, canvas]) => {
    layout.paint(chapter, pageNum, canvas.canvas, canvas.resolution);
  });

  // Adjust the active page in the chapter
  rx.Observable.combineLatest(data.currentPage, data.chapter)
    .forEach(([p, c]) => c.jumpPage(p));

  // Generate the page title.
  let titles = rx.Observable.combineLatest(
    data.chapter, data.currentPage
  ).map(([chapter, pageNum]) =>
    `Dim ${chapter.name} <${chapter.pages[pageNum].name}>`
  ).merge(actions.closeChapter.map(() => "Dim"));

  let sinks = {
    DOM: vdom.DOM,
    electron: intentSinks.electron,
    title: titles,
  };

  return sinks;
}

function bootstrap() {
  console.log("Hello from bootstrap!");

  let drivers = {
    DOM: makeDOMDriver("#root"),
    electron: Drivers.makeElectronIPCDriver(_.values(MESSAGE.toGuest)),
    canvas: Drivers.makeCanvasRenderDriver(),
    title: Drivers.makeTitleDriver(),
  };

  // returns a function, dunno what it does.
  Cycle.run(main, drivers);
}

export default function init() {
  document.addEventListener("DOMContentLoaded", bootstrap);
}
