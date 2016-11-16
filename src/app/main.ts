import * as Electron from "electron";
import * as rx from "rxjs";
import * as Cycle from "@cycle/rxjs-run";
import {makeDOMDriver, VNode, div, button, span} from "@cycle/dom";
import {model, AppState} from "./model";
import {MESSAGE} from "../ipc";
import * as _ from "lodash";
import * as Drivers from "./drivers";
import {Direction, getStyleForLayout} from "../layout";
import {Sources, intent, Actions} from "./intent";

interface MainSink {
  DOM: rx.Observable<VNode>;
  electron: Drivers.ElectronIPCStream;
  title: rx.Observable<string>;
}

function view(data: AppState, sources: Sources): {DOM: rx.Observable<VNode>} {
  let totalPages = rx.Observable.of(null).merge(data.chapter.map(x => x.length));
  let doctoredPage = rx.Observable.of(null).merge(data.currentPage);

  let n = rx.Observable.of(null);
  let withPrefix = rx.Observable.combineLatest(
    n.merge(data.openFile),
    n.merge(doctoredPage),
    n.merge(totalPages),
    rx.Observable.of(false).merge(data.isFullscreen),
  )

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

function electronActions(actions: Actions, data: AppState): Drivers.ElectronIPCStream {
  return rx.Observable.merge(
    actions.openFilePrompt.map(() =>
      Drivers.createIPCMessage(MESSAGE.toHost.OpenFile)),

    actions.openFolderPrompt.map(() =>
      Drivers.createIPCMessage(MESSAGE.toHost.OpenFolder)),

    data.isFullscreen.map(x =>
      Drivers.createIPCMessage(MESSAGE.toHost.SetFullScreen, x)),

    data.layout.map(x =>
      Drivers.createIPCMessage(MESSAGE.toHost.LayoutDirection, x.direction)),

    data.layout.map(x =>
      Drivers.createIPCMessage(MESSAGE.toHost.LayoutPage, x.pages)),

    data.layout.map(x =>
      Drivers.createIPCMessage(MESSAGE.toHost.LayoutStyle, getStyleForLayout(x)))
  );
}

function main(sources: Sources): MainSink {
  let actions = intent(sources);

  let data = model(actions);
  let vdom = view(data, sources);

  // Paint on the canvas.
  rx.Observable.combineLatest(
    data.layout, data.currentPage, data.chapter, sources.canvas.canvas,
  ).forEach(([layout, pageNum, chapter, canvas]) => {
    layout.paint(chapter, pageNum, canvas.canvas, canvas.resolution);
  });

  // Adjust the number of pages kept alive in the cache based on the layout
  rx.Observable.combineLatest(data.layout, data.chapter)
    .forEach(([layout, chapter]) => chapter.setPageCount(layout.cacheCount()));

  let cpages = rx.Observable.combineLatest(data.chapter, data.currentPage);

  // Adjust the active page in the chapter
  cpages.forEach(([c, p]) => c.jumpPage(p));

  // Generate the page title.
  let titles = cpages.map(([chapter, pageNum]) =>
    `Dim ${chapter.name} <${chapter.pages[pageNum].name}>`
  ).merge(actions.closeChapter.map(() => "Dim"));

  let sinks = {
    DOM: vdom.DOM,
    electron: electronActions(actions, data),
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
