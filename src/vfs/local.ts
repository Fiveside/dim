// For files on the local disk.
import {VirtualCollection, VirtualPage, IVirtualPageProps} from "./base";
import * as Path from "path";
import * as Bluebird from "bluebird";
import * as fs from "fs";

export class FSCollection extends VirtualCollection {
  root: string;
  constructor(children: VirtualPage[], location: string) {
    super(children, location);
  }

  static async openFolder(path: string): Promise<FSCollection> {
    let files: string[] = await Bluebird.promisify(fs.readdir)(path);
    let children = files.map((filename) => {
      return new FSPage({
        name: filename,
        root: path,
      });
    });
    return new FSCollection(children, path);
  }
}

interface IFSPageProps extends IVirtualPageProps {
  root: string;
}
export class FSPage extends VirtualPage {
  root: string;
  constructor(opts: IFSPageProps) {
    super(opts);
    this.root = opts.root;
  }
  async _load(): Promise<string> {
    debugger;
    return fileUrl(Path.join(this.root, this.name));
  }

  _unload() {
    // Nothing to do here.
  }
}
