import {observable, computed} from "mobx";
import * as Files from "../../lib/files";
import {VirtualRoot, IVirtualFile} from "../../lib/vfs";
import {PageCacher} from "../../lib/page-cache";
const natsort = require("natsort");

export default class Viewer {
  @observable isLoaded: boolean = false;
  // Default to a do-nothing so that methods don't die.
  @observable root: VirtualRoot = new VirtualRoot([]);
  @observable pages: PageCacher;
  @observable archiveName: string = "";

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

    this.archiveName = await Files.getNameFromPath(archivePath);
    this.root = await Files.readThing(archivePath);

    let ns = natsort({insensitive: true});
    let children = this.root.children.slice().sort((l, r) => {
      return ns(l.name, r.name);
    });

    this.pages = new PageCacher(children);
    this.isLoaded = true;
  }

  unload() {
    this.archiveName = "";
    this.root.unload();
    this.isLoaded = false;
    delete this.pages;
  }

  @computed get currentPage(): IVirtualFile {
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
