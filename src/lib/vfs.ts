// Virtual filesystem
// import * as Vinyl from "vinyl";
import * as yauzl from "yauzl";
import * as Bluebird from "bluebird";
import * as pUtil from "./promise";
import {observable, computed} from "mobx";
const fileUrl = require("file-url");
const path = require("path");

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
export abstract class VirtualFile extends VirtualNode {
  @observable _source: string;
  async abstract _load(): Promise<string>;

  async load(): Promise<string> {
    if (!this.isLoaded) {
      this._source = await this._load();
    }
    return this._source;
  }

  unload(): void {
    if (this.isLoaded) {
      URL.revokeObjectURL(this._source);
      this._source = null;
    }
  }

  @computed get isLoaded(): boolean {
    return this._source != null;
  }

  @computed get sourceUrl(): string {
    return this._source;
  }

  name: string;
  constructor(opts: IVirtualFileProps) {
    super();
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
    this._source = URL.createObjectURL(this.contents);
    return this._source;
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

  unload(): void {
    this._source = null;
  }
}
