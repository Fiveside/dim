import * as yauzl from "yauzl";
import {VirtualFile, ZippedVirtualFile} from "./vfs";
import * as Bluebird from "bluebird";


export async function readZip(path: string) {
  let zipfile: yauzl.ZipFile;
  try {
    console.log(path);
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

  return entries
    .filter(e => e.uncompressedSize)
    .map((entry) =>
    new ZippedVirtualFile({
      entry: entry,
      zipFile: zipfile,
      vinylProps: {
        cwd: "/",
        base: "/",
        path: entry.fileName,
      },
    })
  );
}
