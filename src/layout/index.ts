import {VirtualCollection} from "../vfs";
import {autobind} from "core-decorators";
import {observable, autorun} from "mobx";
import {throttleAnimationFrame} from "../lib/util";
import * as _ from "lodash";

export interface LayoutConstructor {
  new(pages: VirtualCollection): Layout;
}

export abstract class Layout {
  @observable pages: VirtualCollection;
  @observable canvas: HTMLCanvasElement;
  _onDestroy: Array<{(): void}> = [];

  constructor(pages: VirtualCollection) {
    this.pages = pages;
    this._onDestroy.push(autorun(this._tick));
    this.delayPaint = throttleAnimationFrame(this.paint.bind(this));
  }

  // Set and clear without destroying the layout
  setCanvas(canvas: HTMLCanvasElement): void {
    if (this.canvas !== canvas) {
      this.canvas = canvas;
    }
  }
  clearCanvas(): void {
    delete this.canvas;
  }

  destroy(): void {
    this._onDestroy.forEach(x => x());
  }

  @autobind
  _tick(): void {
    // Sanity checks.  Required as this is in an autorun.
    let pages = this.pages;
    let canvas = this.canvas;
    if (canvas == null || pages == null) {
      return;
    }
    if (!_.every(pages.currentPages, x => x.isLoaded)) {
      // Still waiting on some pages to load.
      return;
    }

    this.delayPaint();
  }

  // The throttleAnimationFrame version of this.paint.
  delayPaint: {(): void};

  abstract paint(): void;
}


export class SinglePageFitLayout extends Layout {

  constructor(pages: VirtualCollection) {
    super(pages);
    pages.setPageCount(1);
  }

  paint(): void {
    let canvas = this.canvas;
    let source = this.pages.currentPages[0].image;
    if (source == null) {
      console.warn(
        "Layout failed, image is null.  Loaded:",
        this.pages.currentPages[0].isLoaded
      );
    }

    let ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the image so that it is centered on the canvas
    let target = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    };
    let imgAr = source.width / source.height;
    let canvasAr = canvas.width / canvas.height;
    if (imgAr > canvasAr) {
      // image is wider than window
      target.width = canvas.width;
      target.height = source.height * (canvas.width / source.width);
      target.x = 0;
      target.y = (canvas.height / 2) - (target.height / 2);
    } else {
      // image is taller than window
      target.height = canvas.height;
      target.width = source.width * (canvas.height / source.height);
      target.y = 0;
      target.x = (canvas.width / 2) - (target.width / 2);
    }

    ctx.drawImage(source, target.x, target.y, target.width, target.height);
  }
}
