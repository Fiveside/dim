import {observable, computed} from "mobx";
// import * as Files from "../../lib/files";
// import {VirtualCollection, VirtualPage, IVirtualPage} from "../../vfs/base";
// import {PageCacher} from "../../lib/page-cache";
import * as Path from "path";
// const natsort = require("natsort");
import * as VFS from "../../vfs";

export default class Viewer {
  @observable isLoaded: boolean = false;
  // Default to a do-nothing so that methods don't die.
  @observable chapter: VFS.VirtualCollection;

  @computed get pageNumber() {
    return this.chapter.pageNum;
  }

  @computed get pageTotal(): number {
    return this.chapter.length;
  }

  _setChapter(pages: VFS.VirtualCollection) {
    this.chapter = pages;
    this.isLoaded = true;
  }

  // Resolves when the load has completed.
  async load(archivePath: string) {
    if (this.isLoaded) {
      this.unload();
    }

    this._setChapter(await VFS.readThing(archivePath));
  }

  unload() {
    this.chapter.unload();
    this.isLoaded = false;
    delete this.chapter;
  }

  @computed get currentPage(): VFS.IVirtualPage {
    return this.chapter.currentPage;
  }

  setPage(pageNum: number): boolean {
    // Assert that we can first.
    if (this.chapter.length <= pageNum || pageNum < 0) {
      return false;
    }
    this.chapter.jumpPage(pageNum);
    return true;
  }

  nextPage(): boolean {
    if (this.chapter.pageNum + 1 >= this.chapter.length) {
      return false;
    }
    this.chapter.navNext();
    return true;
  }

  previousPage(): boolean {
    if (this.chapter.pageNum <= 0) {
      return false;
    }
    this.chapter.navPrev();
    return true;
  }

  async nextChapter(): Promise<boolean> {
    console.log("nextChapter");
    try {
      let next = await VFS.nextReadable(this.chapter);
      if (next != null) {
        this._setChapter(next);
      }
      return next != null;
    } catch (err) {
      console.error("something happen", err);
      return false;
    }
  }

  async prevChapter(): Promise<boolean> {
    console.log("prevChapter");
    try {
      let next = await VFS.prevReadable(this.chapter);
      if (next != null) {
        this._setChapter(next);
      }
      return next != null;
    } catch (err) {
      console.error("Something happen", err);
      return false;
    }

  }
}
