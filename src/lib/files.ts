import * as yauzl from "yauzl";
import {ZippedFile, ZipRoot} from "./vfs";
import * as Bluebird from "bluebird";


export async function readZip(path: string) {
  let zipfile: yauzl.ZipFile;
  try {
    zipfile = await Bluebird.fromCallback(cb => yauzl.open(path, {autoClose: false}, cb));
  } catch (err) {
    console.error(err);
    throw err;
  }

  let entries: yauzl.Entry[] = [];

  zipfile.on("entry", (entry: yauzl.Entry) => {
    entries.push(entry);
  });

  // Wait for all entries to be found
  await new Promise(resolve => {
    zipfile.on("end", resolve);
  });

  let nodes = entries
  .filter(e => e.uncompressedSize)
  .map((entry) => {
    return new ZippedFile({
      entry: entry,
      zipFile: zipfile,
      name: entry.filename,
    });
  });

  return new ZipRoot(nodes, {zipFile: zipfile});
}
