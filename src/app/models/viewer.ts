import {observable, computed} from "mobx";
import * as Files from "../../lib/files";
import {VirtualRoot, IVirtualFile} from "../../lib/vfs";
import {PageCacher} from "../../lib/page-cache";
import * as Path from "path";
const natsort = require("natsort");

export default class Viewer {
  @observable isLoaded: boolean = false;
  // Default to a do-nothing so that methods don't die.
  @observable root: VirtualRoot = new VirtualRoot([]);
  @observable pages: PageCacher;

  @observable archivePath: string = "";
  @observable archiveName: string = "";

  @computed get pageNumber() {
    return this.pages.pageNum;
  }

  @computed get pageTotal(): number {
    return this.root.length;
  }

  _setChapter(archivePath: string, root: VirtualRoot) {
    this.archivePath = archivePath;
    this.archiveName = Path.basename(archivePath);

    this.root = root;

    let ns = natsort({insensitive: true});
    let children = this.root.children.slice().sort((l, r) => {
      return ns(l.name, r.name);
    });

    this.pages = new PageCacher(children);
    this.isLoaded = true;
  }

  // Resolves when the load has completed.
  async load(archivePath: string) {
    if (this.isLoaded) {
      this.unload();
    }

    this._setChapter(archivePath, await Files.readThing(archivePath));
  }

  unload() {
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

  async nextChapter(): Promise<boolean> {
    console.log("nextChapter");
    try {
      let next = await Files.nextReadable(this.archivePath);
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
      let next = await Files.prevReadable(this.archivePath);
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
