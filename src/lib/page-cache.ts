// This acts as a cache for vfs pages managing loading and unloading.
import {VirtualFile} from "./vfs";
import {observable} from "mobx";

export class PageCacher {
  _pages: VirtualFile[];
  @observable pageNum: number;

  // stacks
  _nextPageCache: Array<VirtualFile> = [];
  _prevPageCache: Array<VirtualFile> = [];

  _nextCacheSize = 2;
  _prevCacheSize = 2;

  @observable currentPage: VirtualFile;

  // pages must be an array of 1 or more
  constructor(pages: VirtualFile[]) {
    this._pages = pages;
    this.jumpPage(0);
  }

  // Used to set a page and flush the caches.
  // promise resolves when the current page is done loading.
  async jumpPage(pageNum: number): Promise<void> {
    if (pageNum < 0 || pageNum >= this._pages.length) {
      console.warn("Attempted to navigate to a page that was out of range.");
      return;
    }

    this.pageNum = pageNum;
    this.currentPage = this._pages[pageNum];

    // Flush the previous caches
    this._nextPageCache.forEach(x => x.unload());
    this._prevPageCache.forEach(x => x.unload());

    // up the next and previous cache.
    this._nextPageCache = this._pages.slice(
      this.pageNum + 1,
      this.pageNum + 1 + this._nextCacheSize
    );
    this._prevPageCache = this._pages.slice(
      Math.max(this.pageNum - 1 - this._prevCacheSize, 0),
      Math.max(this.pageNum - 1, 0)
    ).reverse();

    await this.currentPage.load();

    // Load all subsequent pages.
    let p: Promise<any> = Promise.resolve();
    if (this._nextPageCache[0] != null) {
      p = this._nextPageCache[0].load();
    }
    p.then(() => {
      this._nextPageCache.slice(1).map(x => x.load());
      this._prevPageCache.map(x => x.load());
    });
  }

  navNext() {
    // debugger;
    if (this.pageNum >= this._pages.length - 1) {
      console.warn("Attempted to navigate to a page that was out of range.");
      return;
    }

    let nextLoadNum = this.pageNum + this._nextPageCache.length + 1;
    if (nextLoadNum < this._pages.length) {
      this._nextPageCache.push(this._pages[nextLoadNum]);
      this._pages[nextLoadNum].load();
    }

    this._prevPageCache.unshift(this.currentPage);
    this.currentPage = this._nextPageCache.shift();
    if (this._prevPageCache.length > this._prevCacheSize) {
      this._prevPageCache.pop().unload();
    }

    this.pageNum += 1;
  }

  navPrev() {
    // debugger;
    if (this.pageNum <= 0) {
      console.warn("Attempted to navigate to a page that was out of range.");
      return;
    }

    let prevLoadNum = this.pageNum - this._prevPageCache.length - 1;
    if (prevLoadNum >= 0) {
      let page = this._pages[prevLoadNum];
      this._prevPageCache.push(page);
      page.load();
    }

    this._nextPageCache.unshift(this.currentPage);
    this.currentPage = this._prevPageCache.shift();
    if (this._nextPageCache.length > this._nextCacheSize) {
      this._nextPageCache.pop().unload();
    }

    this.pageNum -= 1;
  }
}
