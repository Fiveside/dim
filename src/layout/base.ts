import {VirtualCollection} from "../vfs";
import {autobind} from "core-decorators";
import {throttleAnimationFrame} from "../lib/util";
import * as _ from "lodash";

// export interface LayoutConstructor {
//   new(pages: VirtualCollection): Layout;
// }

export type DrawSource = HTMLCanvasElement | HTMLImageElement;

export enum Direction {
  RTL,
  LTR
}
export enum LayoutPages {
  Single,
  Double,
  Smaht,
}

export interface Resolution {
  x: number;
  y: number;
}

export interface ILayout {
  readonly pages: LayoutPages;
  readonly direction: Direction;

  // Paints to the specified canvas.
  paint(chapter: VirtualCollection, pageNum: number, canvas: HTMLCanvasElement, suggestedRes: Resolution): void;

  // Returns the suggested number of pages to step when going to the next page.
  nextPageStep(chapter: VirtualCollection, pageNum: number): Promise<number>;

  // Returns the suggested number of pages to step when going to the previous page.
  prevPageStep(chapter: VirtualCollection, pageNum: number): Promise<number>;

  // Returns the suggested number of pages to keep actively in the cache.
  cacheCount(): number;
}

export abstract class Layout implements ILayout {
  pages: LayoutPages;
  direction: Direction;
  constructor(pages: LayoutPages, direction: Direction) {
    this.pages = pages;
    this.direction = direction;
  }
  abstract nextPageStep(chapter: VirtualCollection, pageNum: number): Promise<number>;
  abstract prevPageStep(chapter: VirtualCollection, pageNum: number): Promise<number>;
  abstract cacheCount(): number;

  abstract _paintOne(canvas: HTMLCanvasElement, suggestedRes: Resolution, page: DrawSource): void;
  abstract _paintTwo(canvas: HTMLCanvasElement, suggestedRes: Resolution, leftPage: DrawSource, rightPage: DrawSource): void;

  isSinglePageMode(img: DrawSource): boolean {
    // Check and see if the left page's aspect ratio is beyond some threshold
    // If so, then paint and behave in single page mode
    let ar = img.width / img.height;
    return ar >= 1;
  }

  async paint(chapter: VirtualCollection, pageNum: number, canvas: HTMLCanvasElement, suggestedRes: Resolution): Promise<void> {
    let lpc = chapter.pages[pageNum];
    let rpc = chapter.pages[pageNum + 1];

    if (lpc == null) {
      // Can't paint.
      console.error("Cannot paint, left page is null (???)");
      return;
    }

    canvas.width = suggestedRes.x;
    canvas.height = suggestedRes.y;

    let lpage = await lpc.image;

    if (this.pages === LayoutPages.Single || rpc == null) {
      // Single layout.
      this._paintOne(canvas, suggestedRes, lpage);
      return;
    }

    let rpage = await rpc.image;
    let chooseSingle = this.isSinglePageMode(lpage) || this.isSinglePageMode(rpage)

    if (this.pages === LayoutPages.Smaht && chooseSingle) {
      // Smart layout resolved to single page.
      this._paintOne(canvas, suggestedRes, lpage);
      return;
    }

    // Dual page layout.
    if (this.direction === Direction.RTL) {
      // Manga mode, swap pages.
      let temp = lpage;
      lpage = rpage;
      rpage = temp;
    }
    this._paintTwo(canvas, suggestedRes, lpage, rpage);
  }
}
