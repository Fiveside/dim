import {VirtualCollection, VirtualPage, IVirtualPageProps} from "./base";
import * as Bluebird from "bluebird";
import * as fs from "fs";
const ARC = require("../vendor/libarchive-3.2.0");

// TODO:
// * emscripten has some experimental code for adding async js callbacks
// * Archives must currently be loaded into memory (to prevent async calls)
// * This doesn't open and handle large files (node limitation and shimmed
//   int64_t handling in callbacks)

// Some #DEFINE values from libarchive.
// corresponds to ARCHIVE_* definitions
const ARCHIVE = {
  EOF: 1,
  OK: 0,
  RETRY: -10,
  WARN: -20,
  FAILED: -25,
  FATAL: -30,
};

// Some #DEFINE values from stdio.h
const SEEK = {
  SET: 0,
  CUR: 1,
  END: 2,
};

function mallocPtr(): EmPtr {
  return ARC._malloc(Uint32Array.BYTES_PER_ELEMENT);
}
function deref(ptr: EmPtr): number {
  return ARC.getValue(ptr, "*");
}
function freePtr(ptr: EmPtr) {
  ARC._free(ptr);
}
function getString(ptr: EmPtr) {
  return ARC.Pointer_stringify(ptr);
}

// Emscripten pointer
type EmPtr = number;


// Creating a unique signature to identify collections from within the
// emscripten module.
let _sigCounter: number = 0;
function createSig() {
  return _sigCounter++;
}

// Libarchive callback functions receive a clientData pointer.  This is a
// map mapping those pointers to real objects in javascript.
// This is neccesary because we can only attach a limited number of js callbacks
// to an emscripten compiled module.  Objects should register themselves here
const CALLBACK_REGISTRY = new Map<number, ArchiveController>();

function arcRead(a: EmPtr, clientData: EmPtr, buf: EmPtr): Number {
  // struct archive *a, void *clientData, void **buf
  // return ssize_t

  // Allocate memory for a buffer (if not already done so), and set *buf to
  // the address of the buffer.  Then write the read data to said buffer and
  // return number of bytes read.
  // Can also return ARCHIVE_* failure types (they're negative, so no collision)
  // Libarchive is a streaming library, so we can just recycle the current buffer
  // every time.

  let col = CALLBACK_REGISTRY.get(clientData);
  if (col == null) {
    console.error("Failed to retrieve controller from registry");
    return ARCHIVE.FATAL;
  }

  // Read either to the length of the buffer or to the end of the file.
  let end = Math.min(col.arcBuf.length, col.readOffset + col.buf.length);

  // Cache some stuff to avoid . lookups
  let readPtr = col.readOffset;
  let colBuf = col.buf;
  let arcBuf = col.arcBuf;
  let i = 0;
  for (; i < end - readPtr; ++i) {
    colBuf[i] = arcBuf[readPtr + i];
  }
  col.readOffset += i;

  ARC.setValue(buf, col.bufLoc, "*");
  return i;
}

function arcSeek(a: EmPtr, clientData: EmPtr, offsetLo: number, offsetHi: number, whence: number) {
  // struct archive *a, void *clientData, int64_t offset, int whence
  // return int64_t

  // Javascript cannot hold an int64 natively.  Emscripten works around this
  // by passing int64s as 2 separate values.  To return an int64 from a function,
  // invoke `arc.Runtime.setTempRet0(int64_hi)` and return int64_lo.

  // TODO: Support int64_t math in this function.
  let col = CALLBACK_REGISTRY.get(clientData);
  if (col == null) {
    console.error("Failed to retrieve controller from registry");
    return ARCHIVE.FATAL;
  }

  let newOffset = col.readOffset;
  switch (whence) {
    case SEEK.SET:
      newOffset = offsetLo;
      break;
    case SEEK.CUR:
      newOffset += offsetLo;
      break;
    case SEEK.END:
      newOffset = col.arcBuf.length + offsetLo;
      break;
    default:
      console.error("Libarchive invoked jscallback with garbage.");
      return ARCHIVE.FATAL;
  }

  col.readOffset = newOffset;
  ARC.Runtime.setTempRet0(0);
  return col.readOffset;
}

function arcClose(a: EmPtr, clientData: EmPtr): number {
  // int archive_close_callback(struct archive *a, void *clientData)
  // return ARCHIVE_OK on success.
  let col = CALLBACK_REGISTRY.get(clientData);
  if (col == null) {
    console.error("Failed to retrieve controller from registry");
    return ARCHIVE.FATAL;
  }

  return ARCHIVE.OK;
}

function arcOpen(a: EmPtr, clientData: EmPtr): number {
  // int archive_open_callback(struct archive *, void *client_data)
  // return ARCHIVE_OK on success
  let col = CALLBACK_REGISTRY.get(clientData);
  if (col == null) {
    console.error("Failed to retrieve controller from registry");
    return ARCHIVE.FATAL;
  }

  return ARCHIVE.OK;
}

const arcOpenPtr = ARC.Runtime.addFunction(arcOpen);
const arcReadPtr = ARC.Runtime.addFunction(arcRead);
const arcSeekPtr = ARC.Runtime.addFunction(arcSeek);
const arcClosePtr = ARC.Runtime.addFunction(arcClose);

function getError(archive: EmPtr) {
  let errPtr = ARC._archive_error_string(archive);
  return getString(errPtr);
}

interface IArchiveControllerProps {
  archive: Buffer;
}
class ArchiveController {
  // Buffer location for scratch data.
  // These are set by the libarchive callbacks.
  get bufSize() { return 4096; };
  bufLoc: EmPtr;
  buf: Uint8Array;

  // archive*
  archive: EmPtr;

  // current archive_entry*
  archiveEntryPtr: EmPtr = mallocPtr();
  get archiveEntry(): EmPtr {
    return deref(this.archiveEntryPtr);
  }

  // Emscripten callback identifier
  sig = createSig();

  // The read offset for the current virutal file descriptor.
  // TODO: rewrite this as int64_t
  readOffset: number = 0;
  arcBuf: Buffer;

  // Flags describing the internal libarchive state.
  isOpen: false;

  constructor(opts: IArchiveControllerProps) {
    this.arcBuf = opts.archive;
    this.bufLoc = ARC._malloc(Uint32Array.BYTES_PER_ELEMENT * this.bufSize);
    this.buf = new Uint8Array(ARC.HEAPU8.buffer, this.bufLoc, this.bufSize);
  }

  destroy(): void {
    if (ARC._archive_read_finish(this.archive) !== ARCHIVE.OK) {
      console.warn("Libarchive reported error while closing: ", getError(this.archive));
    }
    this.close();

    CALLBACK_REGISTRY.delete(this.sig);
    freePtr(this.archiveEntry);
    freePtr(this.bufLoc);
  }

  open(): void {
    if (this.isOpen) {
      this.close();
    }
    // Opens the archive
    this.archive = ARC._archive_read_new();
    ARC._archive_read_support_compression_all(this.archive);
    ARC._archive_read_support_format_all(this.archive);
    ARC._archive_read_set_seek_callback(this.archive, arcSeekPtr);
    ARC._archive_read_open(
      this.archive,
      this.sig,
      arcOpenPtr,
      arcReadPtr,
      arcClosePtr,
    );

    let err = ARC._archive_read_next_header(this.archive, this.archiveEntryPtr);
    if (err === ARCHIVE.EOF) {
      console.error("Archive is empty!");
      throw new TypeError("Archive is empty!");
    } else if (err !== ARCHIVE.OK) {
      console.error("Libarchive failed to read header", getError(this.archive));
    }
  }

  close(): void {
    if (!this.isOpen) {
      return;
    }
    if (ARC._archive_read_finish(this.archive) !== ARCHIVE.OK) {
      console.error("Libarchive failed to close file ???", getError(this.archive));
    }
  }

  getEntryName(): string {
    let pathPtr = ARC._archive_entry_pathname(this.archiveEntry);
    if (pathPtr == null) {
      return null;
    }
    return getString(pathPtr);
  }

  nextHeader() {
    let err = ARC._archive_read_next_header(this.archive, this.archiveEntryPtr);
    if (err === ARCHIVE.EOF) {
      // Archive has finished.  Cycle it.  Implies a pseudo nextHeader call.
      this.close();
      this.open();
    } else if (err !== ARCHIVE.OK) {
      console.error("Libarchive failed to read header", getError(this.archive));
    }
  }

  collectHeaderInfo(): Array<string> {
    this.close();
    this.open();

    let headers: Array<string> = [];
    while (true) {
      headers.push(this.getEntryName());
      let err = ARC._archive_read_next_header(this.archive, this.archiveEntryPtr);
      if (err === ARCHIVE.EOF) {
        break;
      } else if (err !== ARCHIVE.OK) {
        console.error("Libarchive failed to read header", getError(this.archive));
      }
    }

    this.close();
    this.open();
    return headers;
  }

  readData(): Array<Uint8Array> {
    let entryBufPtr = mallocPtr();
    let sizePtr = mallocPtr();
    let offsetPtr = mallocPtr();

    let bufs: Array<Uint8Array> = [];
    while (true) {
      let ret = ARC._archive_read_data_block(
        this.archive,
        entryBufPtr,
        sizePtr,
        offsetPtr
      );

      if (ret === ARCHIVE.EOF) {
        break;
      }

      let entryBuf = deref(entryBufPtr);
      let size = deref(sizePtr);

      // libarchive recycles memory after use.  clone it so it doesn't
      // get recycled mid-extract.
      let mount = new Uint8Array(ARC.HEAPU8.buffer, entryBuf, size);
      bufs.push(mount.slice());
    }

    // // Concat into a single arraybuffer and copy out of emscripten land.
    // let dataSize = bufs.map(x => x.length).reduce((l, r) => l + r, 0);
    // let data = new Uint8Array(dataSize);
    // let pos = 0;
    // for (let buf of bufs) {
    //   data.set(buf, pos);
    //   pos += buf.length;
    // }

    freePtr(entryBufPtr);
    freePtr(sizePtr);
    freePtr(offsetPtr);

    this.nextHeader();

    // return data.buffer;
    return bufs;
  }

  setFile(filename: string) {
    let headerPtr = mallocPtr();

    while (true) {
      let err = ARC._archive_read_next_header(this.archive, headerPtr);
      if (err === ARCHIVE.EOF) {
        // cycle the archive.
      } else if (err !== ARCHIVE.OK) {
        console.error("Libarchive failed to read header", getError(this.archive));
      }
    }
  }
}

export class ArchiveCollection extends VirtualCollection {
  controller: ArchiveController;

  constructor(pages: VirtualPage[], location: string, controller: ArchiveController) {
    super(pages, location);
    this.controller = controller;
  }

  unload(): void {
    super.unload();
    this.controller.destroy();
  }

  static async openArchive(path: string): Promise<ArchiveCollection> {
    let arcBuf = await Bluebird.promisify(fs.readFile)(path);
    let controller = new ArchiveController({
      archive: arcBuf,
    });

    CALLBACK_REGISTRY.set(controller.sig, controller);
    controller.open();

    let pages = controller.collectHeaderInfo().map((name) => {
      return new ArchivePage({
        controller: controller,
        name: name,
      });
    });

    return new ArchiveCollection(pages, path, controller);
  }
}

interface IArchivePageProps extends IVirtualPageProps {
  controller: ArchiveController;
}
export class ArchivePage extends VirtualPage {
  controller: ArchiveController;
  constructor(opts: IArchivePageProps) {
    super(opts);
    this.controller = opts.controller;
  }

  async _load(): Promise<string> {
    while (this.controller.getEntryName() !== this.name) {
      this.controller.nextHeader();
    }
    let data = new Blob(this.controller.readData());
    let url = URL.createObjectURL(data);
    return url;
  }

  _unload(objectUrl: string) {
    URL.revokeObjectURL(objectUrl);
  }
}
