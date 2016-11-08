import * as rx from "rxjs";
import {DOMSource} from "@cycle/dom/rxjs-typings";

type Painter = string;
type Page = string;
type Layout = string;

type AppState = {
  openPath: string | null;
  painter: Painter;
  layout: Layout;
  pages: Array<Page>;  // rx of pages?  promise for pages?
  currentPage: number;  // rx of current page!  solves the null problem.
}

function initialState(): AppState {
  return {
    openPath: null,
    painter: "asdf",
    layout: "asdf",
    pages: [],
    currentPage: 0,
  };
}

function openFile(path: string): Intent {
  console.log("Open file intent constructing");
  return function(state: AppState): AppState {
    console.log("Open file intent executing");
    return state;
  };
}

function openFolder(path: string): Intent {
  console.log("Constructing intent: Open Folder");
  return function(state: AppState): AppState {
    console.log("Executing open folder intent");
    return state;
  };
}

export type Intent = {(state: AppState): AppState};
export const Intents = {
  CHAPTER_OPEN_FILE: openFile,
  CHAPTER_OPEN_FOLDER: openFolder,
  // NAV_PAGE_NEXT: "NAV_PAGE_NEXT",
  // NAV_PAGE_PREV: "NAV_PAGE_PREV",
  // NAV_SHIFT_NEXT: "NAV_SHIFT_NEXT",
  // NAV_SHIFT_PREV: "NAV_SHIFT_PREV",
  // NAV_JUMP: "NAV_JUMP",
  // CHAPTER_OPEN_FILE: "CHAPTER_OPEN_FILE",
  // CHAPTER_CLOSE: "CHAPTER_CLOSE",
  // CHAPTER_NEXT: "CHAPTER_NEXT",
  // CHAPTER_PREV: "CHAPTER_PREV",
  // FULLSCREEN_TOGGLE: "FULLSCREEN_TOGGLE",
  // FULLSCREEN_ENTER: "FULLSCREEN_ENTER",
  // FULLSCREEN_EXIT: "FULLSCREEN_EXIT",
  // LAYOUT_SET_FIT_100: "LAYOUT_SET_FIT_100",
  // LAYOUT_SET_FIT_WIDTH: "LAYOUT_SET_FIT_WIDTH",
  // LAYOUT_SET_DOUBLE: "LAYOUT_SET_DOUBLE",
  // LAYOUT_SET_LTR: "LAYOUT_SET_LTR",
  // LAYOUT_SET_RTL: "LAYOUT_SET_RTL",
};

// export function init(dom: DOMSource) {
//   let loadFile = dom.select("")
// }
