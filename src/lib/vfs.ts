// Virtual filesystem
import * as yauzl from "yauzl";
import * as Bluebird from "bluebird";
import * as pUtil from "./promise";
import {observable, computed} from "mobx";
const fileUrl = require("file-url");
const path = require("path");
import * as Drawing from "./drawing";

// Base class for a filesystem entry structure type thing.
abstract class VirtualEntry {}

export class VirtualRoot extends VirtualEntry {
  @observable children: Array<VirtualFile>;

  @computed get length(): number {
    return this.children.length;
  }

  constructor(children: Array<VirtualFile>) {
    super();
    this.children = children;
  }

  unload(): void {
    // GC all children.
    this.children.forEach(child => child.unload());
  }
}

// File or folder.
abstract class VirtualNode extends VirtualEntry {
  name: string;
  parent: VirtualEntry;
}

interface IVirtualFileProps {
  name: string;
}

export interface IVirtualFile {
  image: Drawing.DrawSource;
  load(): Promise<Drawing.DrawSource>;
  unload(): void;
  isLoaded: boolean;
  isLoading: boolean;
  name: string;
}

export abstract class VirtualFile extends VirtualNode implements IVirtualFile {
  _source: string;
  image = new Image();
  // canvas = document.createElement("canvas");

  @observable isLoaded: boolean = false;
  isLoading: boolean = false;

  async abstract _load(): Promise<string>;
  abstract _unload(source: string): any | void;

  // A flag that dictates whether or not the last operation invoked on this
  // was a load operation (false = unload operation).
  _lastLoad: boolean = false;
  _loadPromise: Promise<any> = null;

  _transitionComplete() {
    if (this._lastLoad && !this.isLoaded) {
      this.load();
    } else if (!this._lastLoad && this.isLoaded) {
      this.unload();
    }
  }

  async load(): Promise<Drawing.DrawSource> {
    this._lastLoad = true;
    // .load() on already loaded
    if (this.isLoading) {
      return await this._loadPromise;
    }
    if (this.isLoaded) {
      return this.image;
    }

    this._loadPromise = new Promise(async (resolve, reject) => {
      try {
        this._source = await this._load();
        resolve(await this.doLoad());
      } catch (err) {
        reject(err);
      }
    });

    this.isLoading = true;
    let result: HTMLImageElement;
    try {
      result = await this._loadPromise;
    } finally {
      this.isLoading = false;
      this.isLoaded = true;
      this._transitionComplete();
    }

    return result;
  }

  async doLoad(): Promise<HTMLImageElement> {

    // Load in an image element for painting
    let img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = () => {
        resolve();
      };
      img.onerror = (...args: any[]) => {
        console.error("Error occurred during image loading", args);
        reject("Error occurred during image loading");
      };
      img.src = this._source;
    });

    this.image = img;
    return img;
  }

  unload(): void {
    this._lastLoad = false;
    if (this.isLoading) {
      return;
    }
    if (!this.isLoaded) {
      return;
    }

    delete this.image.src;
    this._unload(this._source);
    this._source = null;
    this.isLoaded = false;
  }

  name: string;
  constructor(opts: IVirtualFileProps) {
    super();
    if (opts.name == null) {
      debugger;
    }
    this.name = opts.name;
  }
}

export interface IMemoryFileProps extends IVirtualFileProps {
  contents: Buffer;
}
export class MemoryFile extends VirtualFile {
  contents: Buffer;
  constructor(opts: IMemoryFileProps) {
    super(opts);
    this.contents = opts.contents;
  }

  async _load(): Promise<string> {
    return URL.createObjectURL(this.contents);
  }

  _unload(source: string) {
    URL.revokeObjectURL(source);
  }
}

interface IZipRootProps {
  zipFile: yauzl.ZipFile;
}
export class ZipRoot extends VirtualRoot {
  zipFile: yauzl.ZipFile;
  constructor(children: Array<VirtualFile>, opts: IZipRootProps) {
    super(children);
    this.zipFile = opts.zipFile;
  }

  unload(): void {
    super.unload();
    this.zipFile.close();
  }
}

export interface IZippedFileProps extends IVirtualFileProps {
  entry: yauzl.Entry;
  zipFile: yauzl.ZipFile;
}

export class ZippedFile extends VirtualFile {
  zipFile: yauzl.ZipFile;
  entry: yauzl.Entry;

  constructor(opts: IZippedFileProps) {
    super(opts);
    this.zipFile = opts.zipFile;
    this.entry = opts.entry;
  }

  async _load(): Promise<string> {
    let readStream = await Bluebird.fromCallback(cb => this.zipFile.openReadStream(this.entry, cb));
    let bufs: Array<Buffer> = [];

    readStream.on("data", (x: Buffer) => bufs.push(x));
    let p = pUtil.unwrapped();
    readStream.on("end", p.resolve);
    readStream.on("error", p.reject);
    readStream.resume();
    await p.promise;

    return URL.createObjectURL(new Blob(bufs));
  }

  _unload(source: string) {
    URL.revokeObjectURL(source);
  }
}

export class FSRoot extends VirtualRoot {
  root: string;
  constructor(children: VirtualFile[], root: string) {
    super(children);
    this.root = root;
  }
}

interface IFSFileProps extends IVirtualFileProps {
  root: string;
}
export class FSFile extends VirtualFile {
  root: string;
  constructor(opts: IFSFileProps) {
    super(opts);
    this.root = opts.root;
  }
  async _load(): Promise<string> {
    return fileUrl(path.join(this.root, this.name));
  }

  _unload() {
    // Nothing to do here.
  }
}
