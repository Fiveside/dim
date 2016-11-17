import * as Electron from "electron";
import * as rx from "rxjs";
import {DOMSource} from "@cycle/dom/rxjs-typings";
import {readThing, VirtualCollection, nextReadable, prevReadable} from "../vfs";
import {toMulticast, toStoreStream} from "../util";
import {Layout, Direction, LayoutPages, LayoutStyle, getLayout} from "../layout";
import {MESSAGE} from "../ipc";
import {ElectronIPCStream} from "./drivers";
import {Actions, BooleanDelta} from "./intent";

export interface AppState {
  currentPage: rx.Observable<number>;
  openFile: rx.Observable<string | null>;
  chapter: rx.Observable<VirtualCollection>;
  layout: rx.Observable<Layout>;
  isFullscreen: rx.Observable<boolean>;
}

enum PageDirection {
  none = 0,
  next = 1,
  prev = -1,
}
interface PageScanLayout {
  layout: Layout;  // Incoming indicates layout changed.
  chapter: VirtualCollection;
}
interface PageScanJump {
  set: boolean;  // Incoming indicates page change.
  by: PageDirection;
}
interface PageScanState {
  layout: Layout;
  chapter: VirtualCollection;
  pageNum: Promise<number>;
}
type PageScan = PageScanLayout | PageScanJump;

async function addAFuckingNumberToAnotherFuckingNumber(base: number, cb: {(): Promise<number>}, modifier: number, max: number): Promise<number> {
  let delta = await cb();
  let newPageNumber = base + (delta * modifier);

  // clamp that page number.
  return Math.min(max - 1, Math.max(0, newPageNumber));
}

// This feels really ugly
function pageReducer(l: PageScanState, r: PageScan): PageScanState {
  let updated: PageScanState = Object.assign({}, l);
  if ((<PageScanJump>r).set == null) {
    // its a layout.
    Object.assign(updated, r);
    return updated;
  }
  // its a jump.  Make sure that we have a layout to work with.
  if (l.layout == null || l.chapter == null) {
    return l;
  }

  let {set, by} = <PageScanJump>r;
  let newPageNum: Promise<number>;
  if (set) {
    newPageNum = Promise.resolve(by);
  } else {
    if (by === PageDirection.next) {
      newPageNum = l.pageNum.then(x => addAFuckingNumberToAnotherFuckingNumber(x,
        () => l.layout.nextPageStep(l.chapter, x),
        1, l.chapter.length));
    } else if (by === PageDirection.prev) {
      newPageNum = l.pageNum.then(x => addAFuckingNumberToAnotherFuckingNumber(x,
        () => l.layout.prevPageStep(l.chapter, x),
        -1, l.chapter.length));
    } else {
      // PageDirection.none
      newPageNum = l.pageNum;
    }
  }
  updated.pageNum = newPageNum;
  return updated;
}

interface ChapterDelta {
  // isDelta: boolean;
  isNext: boolean;
  // set?: Promise<VirtualCollection>;
}
interface ChapterSet {
  set: Promise<VirtualCollection>;
}
function chapterReducer(l: Promise<VirtualCollection>, r: ChapterDelta | ChapterSet) {
  let asDelta = <ChapterDelta>r;
  let asSet = <ChapterSet>r;
  if (asDelta.isNext != null) {
    return l.then(x => {
      if (x == null) {
        // Do nothing if we have a delta based on nothing.
        return null;
      }
      if (asDelta.isNext) {
        return nextReadable(x);
      } else {
        return prevReadable(x);
      }
    });
  } else {
    // its a ChapterSet
    return asSet.set;
  }
}

function currentPageStream(actions: Actions, chapter: rx.Observable<VirtualCollection>, layout: rx.Observable<Layout>): rx.Observable<number> {
  let pageDelta = rx.Observable.of(PageDirection.none)
    .merge(actions.nextPage.mapTo(PageDirection.next))
    .merge(actions.prevPage.mapTo(PageDirection.prev));
  let pageResets = actions.nextChapter
    .merge(actions.prevChapter)
    .merge(actions.openFile)
    .merge(actions.openFolder)
    .merge(actions.closeChapter)
    .mapTo(null)
    .merge(actions.setPage);

  // if delta is set, then the page change is a delta.
  // if set is set, then just redeclare the current page.
  let pageChanges: rx.Observable<number> = pageDelta
    .map(x => (<PageScanJump>{set: false, by: x}))
    .merge(pageResets.map(x => (<PageScanJump>{set: true, by: x})))
    .merge(
      rx.Observable.combineLatest(chapter, layout)
        .map(([chapter, layout]) => (<PageScanLayout>{chapter, layout}))
    ).scan(pageReducer, {pageNum: Promise.resolve(0), chapter: null, layout: null})
    .concatMap(x => x.pageNum);

  return pageChanges;
}

export function model(actions: Actions): AppState {
  let arcBase: rx.Observable<VirtualCollection> = actions.openFile
    .merge(actions.openFolder).map(x => <ChapterSet>{set: readThing(x)})
    .merge(actions.closeChapter.map(x => <ChapterSet>{set: null}))
    .merge(actions.nextChapter.mapTo(<ChapterDelta>{isNext: true}))
    .merge(actions.prevChapter.mapTo(<ChapterDelta>{isNext: false}))
    .scan(chapterReducer, Promise.resolve(null))
  // This has to be concatMap to appease the type system.
  // See https://github.com/ReactiveX/rxjs/issues/2136
    .concatMap(x => x);

  let archive: rx.Observable<VirtualCollection> = toStoreStream(arcBase);

  // Clean up old archives
  // Create an array of 2, the left one (x[0]) will be GCed and the right
  // is active.
  archive.merge(actions.closeChapter.mapTo(null))
    .scan((l: (VirtualCollection | null)[], r: VirtualCollection) => {
      l.push(r);
      l.shift();
      return l;
    }, [null, null]).forEach((x: (VirtualCollection | null)[]) => {
      if (x[0] != null) {
        x[0].dispose();
      }
    });

  // The layout!
  let layout = toStoreStream(rx.Observable.combineLatest(
    rx.Observable.of(LayoutStyle.Fit).merge(actions.layout.setStyle),
    rx.Observable.of(Direction.RTL).merge(actions.layout.setDirection),
    rx.Observable.of(LayoutPages.Smaht).merge(actions.layout.setPages),
  ).map(
    ([style, direction, pages]) => new (getLayout(style))(pages, direction)
  ));

  let currentChapter = rx.Observable.of(null)
    .merge(actions.openFile)
    .merge(actions.openFolder)
    .merge(actions.closeChapter.map(x => null));

  let isFullscreen = actions.isFullscreenChange
    .scan((l: boolean, r: BooleanDelta) => {
      switch (r) {
        case BooleanDelta.True: return true;
        case BooleanDelta.False: return false;
        case BooleanDelta.Toggle: return !l;
      }
    }, Electron.ipcRenderer.sendSync(MESSAGE.toHost.IsFullscreen));

  return {
    currentPage: currentPageStream(actions, archive, layout),
    openFile: currentChapter,
    chapter: archive,
    layout: layout,
    isFullscreen: isFullscreen,
  };
}
