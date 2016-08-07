import {observable, computed} from "mobx";
import * as Files from "../../lib/files";
// import {EventEmitter} from "events";

@observable
export default class Viewer { // extends EventEmitter {
  @observable archiveName: string;
  archivePath: string;

  @observable currentPage: number;

  @observable files: any;

  // Resolves when the load has completed.
  async load(archivePath: string) {
    this.archivePath = archivePath;
    this.files = await Files.readZip(archivePath);
  }

  nextPage(): boolean {
    return true;
  }

  previousPage(): boolean {
    return false;
  }
}
