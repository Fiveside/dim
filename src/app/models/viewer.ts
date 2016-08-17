import {observable, computed} from "mobx";
import * as Files from "../../lib/files";
import {VirtualRoot, VirtualFile} from "../../lib/vfs";
// import {EventEmitter} from "events";

export default class Viewer { // extends EventEmitter {
  @observable isLoaded: boolean = false;
  // Default to a do-nothing so that methods don't die.
  @observable pages: VirtualRoot = new VirtualRoot([]);
  @observable archivePath: string = "";
  @observable pageNumber: number = 0;

  @computed get pageTotal(): number {
    return this.pages.length;
  }

  // Resolves when the load has completed.
  async load(archivePath: string) {
    if (this.isLoaded) {
      this.unload();
    }
    this.archivePath = archivePath;
    this.pages = await Files.readThing(archivePath);
    this.setPage(0);
    this.isLoaded = true;
    this.currentPage.load();
  }

  unload() {
    this.archivePath = "";
    this.pages.unload();
    this.isLoaded = false;
    this.pageNumber = 0;
  }

  @computed get currentPage(): VirtualFile {
    return this.pages.children[this.pageNumber];
  }

  async _setPage(pageNum: number): Promise<any> {
    let current = this.currentPage;
    let page = this.pages.children[pageNum];
    if (current !== page) {
      await page.load();
    }
    this.pageNumber = pageNum;
    current.unload();
  }

  setPage(pageNum: number): boolean {
    // Assert that we can first.
    if (this.pages.length <= pageNum || pageNum < 0) {
      return false;
    }
    this._setPage(pageNum);
    return true;
  }

  nextPage(): boolean {
    console.log("Next paging", this.pageNumber)
    return this.setPage(this.pageNumber + 1);
  }

  previousPage(): boolean {
    return this.setPage(this.pageNumber - 1);
  }
}
