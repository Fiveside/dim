import {VirtualCollection} from "../vfs";
import {autobind} from "core-decorators";
import {observable, autorun} from "mobx";
import {throttleAnimationFrame} from "../lib/util";
import * as _ from "lodash";

export interface LayoutConstructor {
  new(pages: VirtualCollection): Layout;
}

export type DrawSource = HTMLCanvasElement | HTMLImageElement;

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

  nextPage() {
    this.pages.navNext();
  }
  prevPage() {
    this.pages.navPrev();
  }

  get currentPages() {
    return this.pages.currentPages;
  }

  get currentPageRange() {
    return this.pages.currentPageRange;
  }

  abstract _paint(): void;

  paint(): void {
    // This is often called asynchronously.  So make sure that the images
    // are loaded before doing anything
    if (!_.every(this.pages.currentPages.map(x => x.isLoaded))) {
      return;
    }
    return this._paint();
  }
}
