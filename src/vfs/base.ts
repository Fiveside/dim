import {observable, computed, transaction} from "mobx";
import * as Drawing from "../lib/drawing";
import * as Path from "path";
const natsort = require("natsort");


/*
Scratchpad for what the new vfs layer should look like.

VirtualCollection - collection of images.
  * Manages page load and unload, page cacheing, current page.
  * contains next, prev, setPage methods
  * CAN CONTAIN ZERO ITEMS (actually important this time)
  * VirtualCollection is abstract, but may be extended
    * Hard implementations should have methods for loading
      * eg ZipCollection.fromZip("path/to/file.zip")
      * maybe also accept a file descriptor?  Memory buffer?  Stream?
    * Should contain nextCollection, previousCollection methods
      * Might need to belong somewhere else, sounds weird having ZipCollection
        do filesystem access.

VirtualPage - an image, contains a paintable.
  * Load/Unload/Loading logic (keep this logic from current vfs)
  * Immediately render to canvas (fixes slow page turning)

Need something for dual pages/HQ rendering.  Probably lives on VirtualCollection
Composition?
  * Has a canvas element that it can paint to.
  * Set internal canvas resolution and paint?
  * public paint method accepts canvas (useful for bypassing cache)?
  * Should this also be commanded?
  * run hq paint in worker?

Composition2
  * Has a canvas element
  * Listens to outside instructions
  * Cache valid/invalid flags to determine cache bypass (resizing window)
  * Consumes 1-n pages and paints them on the intermediate canvas.
  * VirtualCollection can base cache on this thing?
  * Subclasses into different drawing styles
  * Accepts a canvas element and paints to it
    * Is allowed to resize the passed canvas!

* Mitchell/Catmull-Rom?  Might be useful for upscaling
* Lanczos 2 or 3 lobes?
* Hermite?
*/


// Base class for a filesystem entry structure type thing.
abstract class VirtualEntry {}

export abstract class VirtualCollection extends VirtualEntry {
  @observable location: string;
  @observable pages: Array<VirtualPage>;
  @observable pageNum: number;

  // should behave like [_pageNum, _lPageNum)
  @computed get _lPageNum() { return this.pageNum + this.currentPageCount; }

  // stacks for the currently loaded pages.
  _nextPageCache: Array<IVirtualPage> = [];
  _prevPageCache: Array<IVirtualPage> = [];

  _nextCacheSize = 20;
  _prevCacheSize = 10;

  @observable currentPages: Array<IVirtualPage> = [];
  @observable currentPageCount: number = 1;

  @computed get currentPageRange(): Array<number> {
    return this.currentPages.map((x, idx) => idx + this.pageNum);
  }

  @computed get name(): string { return Path.basename(this.location); }
  @computed get length(): number { return this.pages.length; }

  constructor(pages: Array<VirtualPage>, location: string) {
    super();
    this.location = location;

    // Page natural order.
    let ns = natsort({insensitive: true});
    this.pages = pages.slice().sort((l, r) => {
      return ns(l.name, r.name);
    });

    this.jumpPage(0);
  }

  unload(): void {
    // GC all children.
    // This collection should be unusable after this.
    this.pages.forEach(child => child.unload());
  }

  setPageCount(numPages: number): Promise<void> {
    this.currentPageCount = numPages;
    return this.jumpPage(this.pageNum);
  }

  // Used to set a page and flush the caches.
  // promise resolves when the current page is done loading.
  async jumpPage(pageNum: number): Promise<void> {
    // debugger;
    // Quick guard to prevent action if the requested page is out of range.
    if (pageNum < 0 || pageNum >= this.pages.length) {
      // console.warn("Attempted to navigate to a page that was out of range.");
      return;
    }

    // immediately awaiting promises
    let p: Array<Promise<any>> = [];

    // delayed promises.
    let ps: Array<{(): Promise<any>}> = [];

    transaction(() => {
      // old items loaded into memory.  Don't need to unload these when done
      let oldCache = this.currentPages.concat(this._nextPageCache, this._prevPageCache);

      this.pageNum = pageNum;
      let fnum = pageNum;
      let lnum = pageNum + this.currentPageCount;

      this.currentPages = this.pages.slice(fnum, lnum);
      // this.currentPage = this.pages[pageNum];

      // up the next and previous cache.
      this._nextPageCache = this.pages.slice(
        lnum,
        lnum + this._nextCacheSize
      );
      this._prevPageCache = this.pages.slice(
        Math.max(fnum - this._prevCacheSize, 0),
        Math.max(fnum, 0)
      ).reverse();

      // Unload any pages that are not in the new cache system
      let newCache = new Set(this.currentPages.concat(this._nextPageCache, this._prevPageCache));
      oldCache.filter(x => !newCache.has(x)).forEach(x => x.unload());

      // Load pages that require it in a mildly smart way.
      // First the current page, Then the next page,
      p.push(Promise.all(this.currentPages.map(x => x.load())));

      // Load all subsequent pages later on.
      if (this._nextPageCache[0] != null) {
        ps.push(() => this._nextPageCache[0].load());
      }
      ps.push(() => Promise.all(this._nextPageCache.slice(1).map(x => x.load())));
      ps.push(() => Promise.all(this._prevPageCache.map(x => x.load())));
    });

    // Load all p promises immediately.
    await Promise.all(p);

    // Optionally allow ps promises to be delay loaded.
    ps.reduce((l, r) => l.then(r), Promise.resolve());
  }

  navNext(): Promise<void> {
    return this.jumpPage(this.pageNum + this.currentPageCount);
  }

  navPrev(): Promise<void> {
    return this.jumpPage(this.pageNum - this.currentPageCount);
  }

  shiftNext(): Promise<void> {
    return this.jumpPage(this.pageNum + 1);
  }

  shiftPrev(): Promise<void> {
    return this.jumpPage(this.pageNum - 1);
  }

  // _nav(numPages: number): void {
  //   // Safety
  //   numPages = Math.min(this._pageNum + numPages, this.pages.length);
  //   if (this._pageNum + numPages >= this.pages.length - 1) {

  //   }
  // }

  // _navPrev() {
  // }

  // shiftNext() {
  //   if (this._pageNum >= this.pages.length - 1) {
  //     // console.warn("Attempted to navigate to a page that was out of range.");
  //     return;
  //   }

  //   let nextLoadNum = this._pageNum + this._nextPageCache.length + 1;
  //   if (nextLoadNum < this.pages.length) {
  //     this._nextPageCache.push(this.pages[nextLoadNum]);
  //     this.pages[nextLoadNum].load();
  //   }

  //   let newPages: Array<VirtualPage> = [];

  //   this._prevPageCache.unshift(this.currentPages.shift());
  //   // this.currentPages.forEach(x => this._prevPageCache.unshift(x));
  //   // this._prevPageCache.unshift(this.currentPage);
  //   this.currentPages.push(this._nextPageCache.shift());
  //   // this.currentPage = this._nextPageCache.shift();
  //   if (this._prevPageCache.length > this._prevCacheSize) {
  //     this._prevPageCache.pop().unload();
  //   }

  //   this._pageNum += 1;
  // }

  // shiftPrev() {
  //   if (this._pageNum <= 0) {
  //     // console.warn("Attempted to navigate to a page that was out of range.");
  //     return;
  //   }

  //   let prevLoadNum = this._pageNum - this._prevPageCache.length - 1;
  //   if (prevLoadNum >= 0) {
  //     let page = this.pages[prevLoadNum];
  //     this._prevPageCache.push(page);
  //     page.load();
  //   }

  //   // this._nextPageCache.unshift(this.currentPages.pop);
  //   this._nextPageCache.unshift(this.currentPages.pop());
  //   // this.currentPage = this._prevPageCache.shift();
  //   this.currentPages.unshift(this._prevPageCache.shift());
  //   if (this._nextPageCache.length > this._nextCacheSize) {
  //     this._nextPageCache.pop().unload();
  //   }

  //   this._pageNum -= 1;
  // }
}

export interface IVirtualPageProps {
  name: string;
}

export interface IVirtualPage {
  image: Drawing.DrawSource;
  load(): Promise<Drawing.DrawSource>;
  unload(): void;
  isLoaded: boolean;
  isLoading: boolean;
  name: string;
}

export abstract class VirtualPage extends VirtualEntry implements IVirtualPage {
  name: string;
  _source: string;

  image: HTMLCanvasElement;
  parent: VirtualCollection;

  @observable isLoaded: boolean = false;
  isLoading: boolean = false;

  // A flag that dictates whether or not the last operation invoked on this
  // was a load operation (false = unload operation).
  _lastLoad: boolean = false;
  _loadPromise: Promise<any> = null;

  constructor(opts: IVirtualPageProps) {
    super();
    if (opts.name == null) {
      debugger;
    }
    this.name = opts.name;
  }

  // Should return a url that we can open (blob urls work too.)
  async abstract _load(): Promise<string>;

  // Accepts the url returned from _load and cleans up any stray resources
  abstract _unload(source: string): any | void;

  _transitionComplete() {
    if (this._lastLoad && !this.isLoaded) {
      this.load();
    } else if (!this._lastLoad && this.isLoaded) {
      this.unload();
    }
  }

  async load(): Promise<Drawing.DrawSource> {
    this._lastLoad = true;
    // .load() on already loaded
    if (this.isLoading) {
      return await this._loadPromise;
    }
    if (this.isLoaded) {
      return this.image;
    }

    this._loadPromise = new Promise(async (resolve, reject) => {
      try {
        this._source = await this._load();
        resolve(await this.doLoad());
      } catch (err) {
        reject(err);
      }
    });

    this.isLoading = true;
    let result: Drawing.DrawSource;
    try {
      result = await this._loadPromise;
    } finally {
      this.isLoading = false;
      this.isLoaded = true;
      this._transitionComplete();
    }

    return result;
  }

  async doLoad(): Promise<HTMLCanvasElement> {
    // Load in an image element for painting
    let img = new Image();
    let canvas = document.createElement("canvas");
    await new Promise((resolve, reject) => {
      img.onload = () => {
        Drawing.fullSize(canvas, img);
        resolve();
      };
      img.onerror = (...args: any[]) => {
        console.error("Error occurred during image loading", args);
        reject("Error occurred during image loading");
      };
      img.src = this._source;
    });

    this.image = canvas;
    return canvas;
  }

  unload(): void {
    this._lastLoad = false;
    if (this.isLoading) {
      return;
    }
    if (!this.isLoaded) {
      return;
    }

    this.isLoaded = false;
    delete this.image;
    let source = this._source;
    this._source = null;
    this._unload(source);
  }
}
