import * as rx from "rxjs";
import {DOMSource} from "@cycle/dom/rxjs-typings";
import {MESSAGE} from "../ipc";
import {ElectronIPCStream, CanvasRenderSource, createIPCMessage}from "./drivers";
import {LayoutPages, Direction, LayoutStyle} from "../layout";

export type Sources = {
  DOM: DOMSource;
  electron: ElectronIPCStream;
  canvas: CanvasRenderSource;
}

export interface Actions {
  nextPage: rx.Observable<any>; // User wants to navigage to the next logical page
  prevPage: rx.Observable<any>; // User wants to navigate to the previous logical page
  setPage: rx.Observable<number>;   // User wants to jump to a specific page
  nextChapter: rx.Observable<any>;  // User wants to navigate to the next chapter
  prevChapter: rx.Observable<any>;  // User wants to navigate to the previous chapter
  openFilePrompt: rx.Observable<any>; // User wants to pick a file
  openFile: rx.Observable<string>;    // User picked a file
  openFolderPrompt: rx.Observable<any>;  // User wants to pick a folder
  openFolder: rx.Observable<string>;  // User picked a folder
  closeChapter: rx.Observable<any>; // User wants to close the currently open chapter
  isFullscreenChange: rx.Observable<boolean>; // User wants to change the fullscreen state
  layout: {
    setPages: rx.Observable<LayoutPages>; // User wants to change the layout page count
    setDirection: rx.Observable<Direction>; // User wants to change the layout reading direction
    setStyle: rx.Observable<LayoutStyle>; // User wants to change the way pages are fit on the screen
  };
}

export function intent(sources: Sources): Actions {
  let filePrompts = sources.DOM.select(".file").events("click");
  let folderPrompts = sources.DOM.select(".folder").events("click");

  let nextPage = sources.DOM.select(".next-page").events("click").merge(
    sources.DOM.select("canvas").events("click"));
  let prevPage = sources.DOM.select(".previous-page").events("click").merge(
    sources.DOM.select("canvas").events("contextmenu"));

  function efilter(electron: ElectronIPCStream, name: string): ElectronIPCStream {
    return electron.filter(x => x.name === name);
  }
  function etranslate(electron: ElectronIPCStream, name: string): rx.Observable<any> {
    return efilter(electron, name).map(x => x.data[0]);
  }

  return {
    prevPage: prevPage,
    nextPage: nextPage,
    setPage: rx.Observable.never(),
    nextChapter: sources.DOM.select(".next-chapter").events("click"),
    prevChapter: sources.DOM.select(".previous-chapter").events("click"),
    openFile: etranslate(sources.electron, MESSAGE.toGuest.OpenFile),
    openFolder: etranslate(sources.electron, MESSAGE.toGuest.OpenFolder),
    openFilePrompt: filePrompts,
    openFolderPrompt: folderPrompts,
    closeChapter: efilter(sources.electron, MESSAGE.toGuest.CloseFile),
    isFullscreenChange: etranslate(sources.electron, MESSAGE.toGuest.Fullscreen),
    layout: {
      setDirection: etranslate(sources.electron, MESSAGE.toGuest.LayoutDirection),
      setStyle: etranslate(sources.electron, MESSAGE.toGuest.LayoutStyle),
      setPages: etranslate(sources.electron, MESSAGE.toGuest.LayoutPage),
    }
  };
}
