// Virtual filesystem
import * as Vinyl from "vinyl";
import * as yauzl from "yauzl";
import * as Bluebird from "bluebird";
import * as pUtil from "./promise";

export class VirtualFile extends Vinyl {

  constructor(opts: Object) {
    super(opts);
  }

  async getSourceUrl(): Promise<string> {
    return URL.createObjectURL(new Blob(this.contents));
  }
}

export interface IZippedVirtualFileProps {
  entry: yauzl.Entry;
  zipFile: yauzl.ZipFile;
  vinylProps: any;
}

export class ZippedVirtualFile extends VirtualFile {
  zipFile: yauzl.ZipFile;
  entry: yauzl.Entry;

  constructor(args: IZippedVirtualFileProps) {
    super(args.vinylProps);
    this.zipFile = args.zipFile;
    this.entry = args.entry;
  }

  async getSourceUrl(): Promise<string> {
    let readStream = await Bluebird.fromCallback(cb => this.zipFile.openReadStream(this.entry, cb));

    let bufs: Array<Buffer> = [];
    readStream.on("data", (x: Buffer) => bufs.push(x));

    let p = pUtil.unwrapped();
    readStream.on("end", p.resolve);
    readStream.on("error", p.reject);

    readStream.resume();
    await p.promise;

    // let buf = Buffer.concat(bufs);
    return URL.createObjectURL(new Blob(bufs));
  }
}
