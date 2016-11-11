import * as rx from "rxjs";
import {DOMSource} from "@cycle/dom/rxjs-typings";
import {readThing, VirtualCollection} from "../vfs";
import {toMulticast} from "../util";
import {Layout, FitLayout, Direction} from "../layout";

type Painter = string;
type Page = string;

export interface AppState {
  currentPage: rx.Observable<number>;
  openFile: rx.Observable<string | null>;
  chapter: rx.Observable<VirtualCollection>;
  layout: rx.Observable<Layout>;
}


// Actions that directly modify the data
export interface Actions {
  nextPage: rx.Observable<any>;
  prevPage: rx.Observable<any>;
  setPage: rx.Observable<number>;
  nextChapter: rx.Observable<any>;
  prevChapter: rx.Observable<any>;
  openFile: rx.Observable<string>;
  openFolder: rx.Observable<string>;
  closeChapter: rx.Observable<string>;
  setLayout: rx.Observable<Layout>;
}

export function model(actions: Actions): AppState {
  let archive: rx.Observable<VirtualCollection> = toMulticast(actions.openFile
    .merge(actions.openFolder)
    .flatMap(x => readThing(x)));

  // Clean up old archives
  // Create an array of 2, the left one (x[0]) will be GCed and the right
  // is active.
  archive.scan((l: (VirtualCollection | null)[], r: VirtualCollection) => {
    l.push(r);
    l.shift();
    return l;
  }, [null, null]).forEach((x: (VirtualCollection | null)[]) => {
    if (x[0] != null) {
      x[0].dispose();
    }
  });

  archive.forEach(x => console.log("Archive is ", x));

  // page delta gonna be weird with layouts.
  let pageDelta = rx.Observable.of(0)
    .merge(actions.nextPage.mapTo(1))
    .merge(actions.prevPage.mapTo(-1));
  let pageResets = actions.nextChapter
    .merge(actions.prevChapter)
    .merge(actions.openFile)
    .merge(actions.openFolder)
    .merge(actions.closeChapter)
    .mapTo(0)
    .merge(actions.setPage);

  let currentChapter = rx.Observable.of(null)
    .merge(actions.openFile)
    .merge(actions.openFolder)
    .merge(actions.closeChapter.map(x => null))

  // This is ugly.
  // if delta is set, then the page change is a delta.
  // if set is set, then just redeclare the current page.
  let pageChanges = pageDelta.map(x => ({set: false, by: x}))
    .merge(pageResets.map(x => ({set: true, by: x})));

  // Make sure that the current page doesn't exceed the total number of pages.
  let currentPage = rx.Observable.combineLatest(pageChanges, archive)
    .scan((l: number, r: [{set: boolean, by: number}, VirtualCollection]) => {
      let [{set, by}, a] = r;
      let num = set ? by : l + by;
      return Math.min(a.length - 1, Math.max(0, num));
    }, 0).distinctUntilChanged();

  // The layout!
  let layout = rx.Observable.of(new FitLayout(1, Direction.LTR));

  return {
    currentPage: currentPage,
    openFile: currentChapter,
    chapter: archive,
    layout: layout,
  };
}
