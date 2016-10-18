import {observable, computed, transaction} from "mobx";
import {getListener} from "../../events";
import * as Layouts from "../../layout";
import * as Path from "path";
import * as VFS from "../../vfs";


// This is designed to be used as a singleton.  As such, there are some
// assumptions made around this.
export default class Viewer {
  @observable isLoaded: boolean = false;

  // Default to a do-nothing so that methods don't die.
  @observable chapter: VFS.VirtualCollection;

  @observable layout: Layouts.Layout = null;
  layoutCtor: Layouts.LayoutConstructor = Layouts.SmartDualPageFitLayout;

  @computed get pageTotal(): number {
    return this.chapter.length;
  }

  constructor() {
    let listener = getListener();
    listener.on("menu:layout", (ltype: string) => {
      let ctor = Layouts.getLayoutByName(ltype);
      if (this.layoutCtor !== ctor) {
        if (this.layout != null) {
          this.layout.destroy();
        }
      }
      this.layoutCtor = ctor;
      if (this.isLoaded) {
        this.layout = new this.layoutCtor(this.chapter);
      }
    });
  }

  _setChapter(pages: VFS.VirtualCollection) {
    console.log("Loading chapter", pages.name);
    transaction(() => {
      this.chapter = pages;
      this.layout = new this.layoutCtor(pages);
      this.isLoaded = true;
    });
  }

  // Resolves when the load has completed.
  async load(archivePath: string) {
    if (this.isLoaded) {
      this.unload();
    }

    this._setChapter(await VFS.readThing(archivePath));
  }

  unload() {
    transaction(() => {
      this.chapter.unload();
      this.isLoaded = false;
      this.layout.destroy();
      delete this.layout;
      delete this.chapter;
    });
  }

  setPage(pageNum: number): boolean {
    // Assert that we can first.
    if (this.chapter.length <= pageNum || pageNum < 0) {
      return false;
    }
    this.chapter.jumpPage(pageNum);
    return true;
  }

  nextPage(): void {
    this.layout.nextPage();
  }

  previousPage(): void {
    this.layout.prevPage();
  }

  async nextChapter(): Promise<boolean> {
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
