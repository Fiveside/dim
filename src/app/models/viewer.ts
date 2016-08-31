import {observable, computed} from "mobx";
import * as Files from "../../lib/files";
import {VirtualRoot, VirtualFile} from "../../lib/vfs";
import {PageCacher} from "../../lib/page-cache";

export default class Viewer {
  @observable isLoaded: boolean = false;
  // Default to a do-nothing so that methods don't die.
  @observable root: VirtualRoot = new VirtualRoot([]);
  @observable pages: PageCacher;
  @observable archivePath: string = "";

  @computed get pageNumber() {
    return this.pages.pageNum;
  }

  @computed get pageTotal(): number {
    return this.root.length;
  }

  // Resolves when the load has completed.
  async load(archivePath: string) {
    if (this.isLoaded) {
      this.unload();
    }
    this.archivePath = archivePath;
    this.root = await Files.readThing(archivePath);
    this.pages = new PageCacher(this.root.children);
    this.isLoaded = true;
  }

  unload() {
    this.archivePath = "";
    this.root.unload();
    this.isLoaded = false;
    delete this.pages;
  }

  @computed get currentPage(): VirtualFile {
    return this.pages.currentPage;
  }

  setPage(pageNum: number): boolean {
    // Assert that we can first.
    if (this.root.length <= pageNum || pageNum < 0) {
      return false;
    }
    this.pages.jumpPage(pageNum);
    return true;
  }

  nextPage(): boolean {
    if (this.pages.pageNum + 1 >= this.root.length) {
      return false;
    }
    this.pages.navNext();
    return true;
  }

  previousPage(): boolean {
    if (this.pages.pageNum <= 0) {
      return false;
    }
    this.pages.navPrev();
    return true;
  }
}
