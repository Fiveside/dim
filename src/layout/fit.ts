import {Layout, DrawSource} from "./base";
import {VirtualCollection, IVirtualPage} from "../vfs";
import * as _ from "lodash";

interface Dimensions {
  x: number;
  y: number;
  width: number;
  height: number;
}

function getDimensions(sourceWidth: number, sourceHeight: number, canvasWidth: number, canvasHeight: number): Dimensions {
  // Draw the image so that it is centered on the canvas
  let target = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };
  let imgAr = sourceWidth / sourceHeight;
  let canvasAr = canvasWidth / canvasHeight;
  if (imgAr > canvasAr) {
    // image is wider than window
    target.width = canvasWidth;
    target.height = sourceHeight * (canvasWidth / sourceWidth);
    target.x = 0;
    target.y = (canvasHeight / 2) - (target.height / 2);
  } else {
    // image is taller than window
    target.height = canvasHeight;
    target.width = sourceWidth * (canvasHeight / sourceHeight);
    target.y = 0;
    target.x = (canvasWidth / 2) - (target.width / 2);
  }
  return target;
}

function paintOne(canvas: HTMLCanvasElement, source: DrawSource): void {
  let target = getDimensions(source.width, source.height, canvas.width, canvas.height);
  let ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, target.x, target.y, target.width, target.height);
}

function paintTwo(canvas: HTMLCanvasElement, lsource: DrawSource, rsource: DrawSource): void {
  // Split canvas in 2 halves.
  // Paint first page right aligned on left half
  // Paint second page left aligned on right half.
  // Paint as 2 separate resized entities
  //   (to smooth over terrible scanlator resizing)
  let cw = Math.floor(canvas.width);
  let cwhalf = Math.floor(cw / 2);
  let middle = cwhalf;
  let ch = Math.floor(canvas.height);

  let ld = getDimensions(lsource.width, lsource.height, cwhalf, ch);
  let rd = getDimensions(rsource.width, rsource.height, cwhalf, ch);

  // If either left or right side is oblong, while the other isn't, scoot
  // the other over to give the oblong one more room.
  if (ld.y !== 0 && rd.y === 0) {
    // left is wide
    middle += cwhalf - rd.width;
    ld = getDimensions(lsource.width, lsource.height, middle, ch);
  } else if (ld.y === 0 && rd.y !== 0) {
    // Right is wide
    middle -= cwhalf - ld.width;
    rd = getDimensions(rsource.width, rsource.height, cw - middle, ch);
  }

  // Calculate x
  ld.x = middle - ld.width;
  rd.x = middle;

  // paint!
  let ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, cw, ch);
  ctx.drawImage(lsource, ld.x, ld.y, ld.width, ld.height);
  ctx.drawImage(rsource, rd.x, rd.y, rd.width, rd.height);
}

export class SinglePageFitLayout extends Layout {

  constructor(pages: VirtualCollection) {
    super(pages);
    pages.setPageCount(1);
  }

  _paint(): void {
    let canvas = this.canvas;
    let source = this.pages.currentPages[0].image;
    // if (source == null) {
    //   console.warn(
    //     "Layout failed, image is null.  Loaded:",
    //     this.pages.currentPages[0].isLoaded
    //   );
    // }
    paintOne(canvas, source);
  }
}

export class DualPageFitLayout extends Layout {
  constructor(pages: VirtualCollection) {
    super(pages);
    pages.setPageCount(2);
  }

  _paint(): void {
    // Split canvas in 2 halves.
    // Paint first page right aligned on left half
    // Paint second page left aligned on right half.
    // Paint as 2 separate resized entities
    //   (to smooth over terrible scanlator resizing)
    // let canvas = this.canvas;
    // let cw = Math.floor(canvas.width);
    // let cwhalf = Math.floor(cw / 2);
    // let middle = cwhalf;
    // let ch = Math.floor(canvas.height);
    // let [pl, pr] = this.pages.currentPages.map(x => x.image);

    // let ld = getDimensions(pl.width, pl.height, cwhalf, ch);
    // let rd = getDimensions(pr.width, pr.height, cwhalf, ch);

    // // If either left or right side is oblong, while the other isn't, scoot
    // // the other over to give the oblong one more room.
    // if (ld.y !== 0 && rd.y === 0) {
    //   // left is wide
    //   middle += cwhalf - rd.width;
    //   ld = getDimensions(pl.width, pl.height, middle, ch);
    // } else if (ld.y === 0 && rd.y !== 0) {
    //   // Right is wide
    //   middle -= cwhalf - ld.width;
    //   rd = getDimensions(pr.width, pr.height, cw - middle, ch);
    // }

    // // Calculate x
    // ld.x = middle - ld.width;
    // rd.x = middle;

    // // paint!
    // let ctx = canvas.getContext("2d");
    // ctx.clearRect(0, 0, cw, ch);
    // ctx.drawImage(pl, ld.x, ld.y, ld.width, ld.height);
    // ctx.drawImage(pr, rd.x, rd.y, rd.width, rd.height);

    let canvas = this.canvas;
    let [lsource, rsource] = this.pages.currentPages.map(x => x.image);

    // If we only have one page, then just paint that one.
    if (rsource == null) {
      paintOne(canvas, lsource);
    } else {
      paintTwo(canvas, lsource, rsource);
    }
  }
}

function isSinglePageMode(page: IVirtualPage): boolean {
  // If the image isn't loaded, then assume single page mode.
  if (!page.isLoaded) {
    return false;
  }

  // Check and see if the left page's aspect ratio is beyond some threshold
  // If so, then paint and behave in single page mode
  let ar = page.image.width / page.image.height;
  return ar >= 1;
}

export class SmartDualPageFitLayout extends Layout {
  constructor(pages: VirtualCollection) {
    super(pages);
    pages.setPageCount(2);
  }

  isSinglePageMode() {
    // If there's only one page, then just paint it.
    let pages = this.pages.currentPages.filter(x => x.isLoaded);
    if (pages.length <= 1) {
      return true;
    }

    let [l, r] = pages;
    return isSinglePageMode(l) || isSinglePageMode(r);
  }

  _paint(): void {
    let [lpage, rpage] = this.pages.currentPages.map(x => x.image);
    let canvas = this.canvas;
    if (this.isSinglePageMode()) {
      paintOne(canvas, lpage);
    } else {
      paintTwo(canvas, lpage, rpage);
    }
  }

  nextPage() {
    if (this.isSinglePageMode()) {
      this.pages.shiftNext();
    } else {
      this.pages.navNext();
    }
  }

  prevPage() {
    // Get the previous page first and check to see if that is a single page we
    // need to navigate to
    let ppage = this.pages.pages[this.pages.pageNum - 1];
    if (ppage == null) {
      return;
    }

    if (isSinglePageMode(ppage)) {
      this.pages.shiftPrev();
    } else {
      this.pages.navPrev();
    }
  }

  get currentPageRange() {
    if (this.isSinglePageMode()) {
      return [this.pages.currentPageRange[0]];
    }
    return this.pages.currentPageRange;
  }

  get currentPages() {
    if (this.isSinglePageMode()) {
      return [this.pages.currentPages[0]];
    }
    return this.pages.currentPages;
  }
}
