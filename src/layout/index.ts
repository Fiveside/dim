// import * as _ from "lodash";
import * as Fit from "./fit";
import * as Base from "./base";
import {VirtualCollection} from "../vfs";

export * from "./base";
export * from "./fit";

// let layouts: {[name: string]: Base.LayoutConstructor} = {
//   "single-page-fit": Fit.SinglePageFitLayout,
//   "dual-page-fit": Fit.DualPageFitLayout,
//   "smart-dual-page-fit": Fit.SmartDualPageFitLayout,
// };

// export function getLayoutByName(name: string): Base.LayoutConstructor {
//   let ctor = layouts[name];
//   if (ctor == null) {
//     throw new TypeError(`Invalid layout name: ${name}`);
//   }
//   return ctor;
// }


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

// export enum Direction {
//   RTL,
//   LTR
// }
// enum PageLayout {
//   Single,
//   Double,
//   Smaht,
// }

// interface Resolution {
//   x: number;
//   y: number;
// }

// export interface Layout {
//   numPages: number;
//   direction: Direction;
//   paint(chapter: VirtualCollection, pageNum: number, canvas: HTMLCanvasElement, suggestedRes: Resolution): void;
// }

// export class FitLayout {
//   numPages: number;
//   direction: Direction;
//   constructor(numPages: number, direction: Direction) {
//     this.numPages = numPages;
//     this.direction = direction;
//   }

//   async paint(chapter: VirtualCollection, pageNum: number, canvas: HTMLCanvasElement, suggestedRes: Resolution) {
//     let page = await chapter.pages[pageNum].image;
//     let sourceWidth = page.width;
//     let sourceHeight = page.height;

//     let canvasWidth = canvas.width = suggestedRes.x;
//     let canvasHeight = canvas.height = suggestedRes.y;

//     let target = {
//       x: 0,
//       y: 0,
//       width: 0,
//       height: 0,
//     };
//     let imgAr = sourceWidth / sourceHeight;
//     let canvasAr = canvasWidth / canvasHeight;
//     if (imgAr > canvasAr) {
//       // image is wider than window
//       target.width = canvasWidth;
//       target.height = sourceHeight * (canvasWidth / sourceWidth);
//       target.x = 0;
//       target.y = (canvasHeight / 2) - (target.height / 2);
//     } else {
//       // image is taller than window
//       target.height = canvasHeight;
//       target.width = sourceWidth * (canvasHeight / sourceHeight);
//       target.y = 0;
//       target.x = (canvasWidth / 2) - (target.width / 2);
//     }

//     let ctx = canvas.getContext("2d");
//     ctx.clearRect(0, 0, canvasWidth, canvasHeight);
//     ctx.drawImage(page, target.x, target.y, target.width, target.height);
//   }
// }
