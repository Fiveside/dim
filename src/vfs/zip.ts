import {VirtualCollection, VirtualPage, IVirtualPageProps} from "./base";
import * as Bluebird from "bluebird";
import * as pUtil from "../lib/promise";
import * as Stream from "stream";
import * as Events from "events";
const yauzl = require("yauzl");

// Simple yauzl interfaces because its not in definately typed.
interface YauzlEntry {
  fileName: string;
  uncompressedSize: number;
}
interface YauzlFile extends Events.EventEmitter {
  close(): void;
  openReadStream(entry: YauzlEntry, cb: (err: string, stream: Stream.Readable) => void): void;
}

interface IZipCollectionProps {
  zipFile: YauzlFile;
  location: string;
}
export class ZipCollection extends VirtualCollection {
  zipFile: YauzlFile;
  constructor(pages: Array<VirtualPage>, opts: IZipCollectionProps) {
    super(pages, opts.location);
    this.zipFile = opts.zipFile;
  }

  unload(): void {
    super.unload();
    this.zipFile.close();
  }

  static async openZip(path: string): Promise<ZipCollection> {
    let zipfile: YauzlFile;
    try {
      zipfile = await Bluebird.fromCallback(cb => yauzl.open(path, {autoClose: false}, cb));
    } catch (err) {
      console.error(err);
      throw err;
    }

    let entries: YauzlEntry[] = [];

    zipfile.on("entry", (entry: YauzlEntry) => {
      entries.push(entry);
    });

    // Wait for all entries to be found
    await new Promise(resolve => {
      zipfile.on("end", resolve);
    });

    let nodes = entries
      .filter(e => e.uncompressedSize)
      .map((entry) => {
        return new ZippedPage({
          entry: entry,
          zipFile: zipfile,
          name: entry.fileName,
        });
      });

    return new ZipCollection(nodes, {
      zipFile: zipfile,
      location: path,
    });
  }
}

export interface IZippedPageProps extends IVirtualPageProps {
  entry: YauzlEntry;
  zipFile: YauzlFile;
}

export class ZippedPage extends VirtualPage {
  zipFile: YauzlFile;
  entry: YauzlEntry;

  constructor(opts: IZippedPageProps) {
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
