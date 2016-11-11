import * as _ from "lodash";
import * as Fit from "./fit";
import * as Base from "./base";
import {VirtualCollection} from "../vfs";

export * from "./base";
export * from "./fit";

let layouts: {[name: string]: Base.LayoutConstructor} = {
  "single-page-fit": Fit.SinglePageFitLayout,
  "dual-page-fit": Fit.DualPageFitLayout,
  "smart-dual-page-fit": Fit.SmartDualPageFitLayout,
};

export function getLayoutByName(name: string): Base.LayoutConstructor {
  let ctor = layouts[name];
  if (ctor == null) {
    throw new TypeError(`Invalid layout name: ${name}`);
  }
  return ctor;
}


// NOTES FOR THE NEW LAYOUT
// Layout has a page collection (rx? probably)
// Layout.paint() takes a page number, and paints that page
//   to the best of its ability.
// IMPORTANT VVVV
// Layout is not in charge of managing the current page in collection
// IMPORTANT ^^^^
// If page is unloaded in collection, layout will wait I guess?
//  maybe instead all pages are always unloaded and layout loads them
//  as required?  lets memory just run out of control for what should be
//  unloaded pages.

enum Direction {
  RTL,
  LTR
}
enum PageLayout {
  Single,
  Double,
  Smaht,
}

class FitLayout {
  numPages: number;
  direction: Direction;
  constructor(numPages: number, direction: Direction) {
    this.numPages = numPages;
    this.direction = direction;
  }

  paint(pages: VirtualCollection, pageNum: number, canvas: HTMLCanvasElement) {
  }
}
