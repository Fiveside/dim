import {observable, computed} from "mobx";
import * as Files from "../../lib/files";
import {VirtualFile} from "../../lib/vfs";
// import {EventEmitter} from "events";

export default class Viewer { // extends EventEmitter {
  @observable isLoaded: boolean = false;
  @observable archivePath: string = "";

  @observable currentPage: number = 0;

  @observable files: Array<VirtualFile> = [];

  @observable sourceUrl: string = "";

  // Resolves when the load has completed.
  async load(archivePath: string) {
    this.archivePath = archivePath;
    this.files = await Files.readZip(archivePath[0]);
    this.isLoaded = true;
    this.sourceUrl = await this.files[0].getSourceUrl();
  }

  unload() {
    this.archivePath = "";
    this.isLoaded = false;
    this.files = [];
  }

  // @computed
  // get sourceUrl(): string {
  //   return this.files[0].getSourceUrl();
  // }

  // getCurrentPage(): File {
  //   return this.files
  // }

  // nextPage(): boolean {
  //   return true;
  // }

  // previousPage(): boolean {
  //   return false;
  // }
}
