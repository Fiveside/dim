const arc = require("./libarchive");
const fs = require("fs");
const crypto = require("crypto");

let rar = fs.readFileSync("test.rar");
// rarLoc = arc._malloc(rar.length + 1)
// arc.writeArrayToMemory(rar, rarLoc)


// This mounts the uint8 array directly in the module, so reading/writing to
// this array directly affects module memory.
// This seems to be managed by libarchive and seems to be freed when
// archive_read_close is called.

// free() this
let bufLoc = arc._malloc(1024);
let buf = new Uint8Array(arc.HEAPU8.buffer, bufLoc, 1024);
let rarPos = 0;

// #define	ARCHIVE_EOF	  1	/* Found end of archive. */
// #define	ARCHIVE_OK	  0	/* Operation was successful. */
// #define	ARCHIVE_RETRY	(-10)	/* Retry might succeed. */
// #define	ARCHIVE_WARN	(-20)	/* Partial success. */
// /* For example, if write_header "fails", then you can"t push data. */
// #define	ARCHIVE_FAILED	(-25)	/* Current operation cannot complete. */
// /* But if write_header is "fatal," then this archive is dead and useless. */
// #define	ARCHIVE_FATAL	(-30) /* No more operations are possible. */

function myread(aa, clientData, buff) {
  // struct archive *a, void *clientData, **buff
  // return ssize_t

  let end = Math.min(rar.length, rarPos + buf.length);
  let i = 0;
  for (; i < end - rarPos; i++) {
    buf[i] = rar[rarPos + i];
  }
  rarPos += i;

  console.log("Read md5", crypto.createHash("md5").update(buf).digest("hex"));

  arc.setValue(buff, bufLoc, "*");
  return i;

  // set *buf to ptr of data
  // return number of bytes read, 0 on eof, or -1 on error.
}

function myclose(aa, clientData) {
  console.log("myclose");
  // struct archive *a, void *clientData
  // return ARCHIVE_OK on success.
  arc._free(bufLoc);
  return 0;
}

// /* whence values for lseek(2) */
// #define	SEEK_SET	0	/* set file offset to offset */
// #define	SEEK_CUR	1	/* set file offset to current plus offset */
// #define	SEEK_END	2	/* set file offset to EOF plus offset */
function myseek(aa, clientData, offsetLo, offsetHi, whence) {
  // struct archive *a, void *clientData, int64_t offset, int whence
  // return int64_t new offset????

  // javascript cannot hold an int64.  its number size is a double.
  // So emscripten pukes everywhere when attempting to handle int64s
  // it passes em in as 2 parameters.  What the hell is this function
  // supposed to return then?

  // Just pretending the most significant 32 bits don"t exist for now
  // let fused = new Int64(offsetHi, offsetLo);

  // console.log("mySeek", arguments, fused.toOctetString());
  var newOffset;
  if (whence === 0) {
    newOffset = offsetLo;
  } else if (whence === 1) {
    newOffset = rarPos + offsetLo;
  } else if (whence === 2) {
    newOffset = rar.length + offsetLo;
  } else {
    console.log("wtf?", whence);
    return -30;
  }

  if (newOffset > rar.length) {
    console.log("failbox");
    return -25;
  }

  // Emscripten int64_t ¯\_(ツ)_/¯
  console.log("Seeked to", newOffset, [offsetLo, whence]);
  rarPos = newOffset;
  arc.Runtime.setTempRet0(0);
  return rarPos;
}

let a = arc._archive_read_new();
console.log("a ptr", a);
arc._archive_read_support_compression_all(a);
arc._archive_read_support_format_all(a);

// console.log(arc._archive_read_open_memory(a, rarLoc, rar.length))
let myReadPtr = arc.Runtime.addFunction(myread);
let myClosePtr = arc.Runtime.addFunction(myclose);
let mySeekPtr = arc.Runtime.addFunction(myseek);
arc._archive_read_set_seek_callback(a, mySeekPtr);
let openErr = arc._archive_read_open(a, 12345, null, myReadPtr, myClosePtr);
console.log("Open err", openErr);

// free() this.
let entryPtr = arc._malloc(Uint32Array.BYTES_PER_ELEMENT);

let headerErr = arc._archive_read_next_header(a, entryPtr);

console.log("read header", headerErr);

let headerErrStrPtr;
if (headerErr === -30) {
  headerErrStrPtr = arc._archive_error_string(a);
  console.log("read header err", arc.Pointer_stringify(headerErrStrPtr));
}

// deref pointer
let entry = arc.getValue(entryPtr, "*");
console.log("entry ptr", entry);

let pathName = arc._archive_entry_pathname(entry);
console.log("get path", arc.Pointer_stringify(pathName));


// free() these.
let entryBufPtr = arc._malloc(Uint32Array.BYTES_PER_ELEMENT);
let sizePtr = arc._malloc(Uint32Array.BYTES_PER_ELEMENT);
let offsetPtr = arc._malloc(Uint32Array.BYTES_PER_ELEMENT);

function getFile(aa) {
  let bufs = [];
  while(true) {
    let ret = arc._archive_read_data_block(aa, entryBufPtr, sizePtr, offsetPtr);

    if (ret == 1) {
      break;
    }

    let entryBuf = arc.getValue(entryBufPtr, "*");
    let size = arc.getValue(sizePtr, "i32");
    let entryOffset1 = arc.getValue(offsetPtr, "i32");
    let entryOffset2 = arc.getValue(offsetPtr+4, "i32");

    let mount = new Uint8Array(arc.HEAPU8.buffer, entryBuf, size);
    console.log("prelim", entryBuf, size, entryOffset1, entryOffset2, mount.slice(0, 8));

    // libarchive owns these.  Don't free() these.
    bufs.push(new Uint8Array(arc.HEAPU8.buffer, entryBuf, size));
  }
  return bufs;
}

// arc._archive_read_close(a)
