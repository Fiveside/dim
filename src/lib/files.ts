import * as yauzl from "yauzl";
import {ZippedFile, ZipRoot, VirtualRoot, FSRoot, FSFile} from "./vfs";
import * as Bluebird from "bluebird";
import * as fs from "fs";
import * as Path from "path";

const natsort = require("natsort");

async function readZip(path: string): Promise<ZipRoot> {
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
      name: entry.fileName,
    });
  });

  return new ZipRoot(nodes, {zipFile: zipfile});
}

async function readFolder(path: string): Promise<FSRoot> {
  let files: string[] = await Bluebird.promisify(fs.readdir)(path)
  let children = files.map((filename) => {
    return new FSFile({
      name: filename,
      root: path,
    });
  });
  return new FSRoot(children, path);
}


export async function readThing(path: string): Promise<VirtualRoot> {
  let stat: fs.Stats = await Bluebird.promisify(fs.lstat)(path);
  if (stat.isDirectory()) {
    return await readFolder(path);
  }
  return await readZip(path);
}

async function exists(path: string): Promise<boolean> {
  let stat: fs.Stats = await Bluebird.promisify(fs.lstat)(path);
  return stat.isDirectory() || stat.isFile();
}

export async function getNameFromPath(path: string): Promise<string> {
  // Assert that the file exists first.
  if (!await exists(path)) {
    // ¯\_(ツ)_/¯
    return path;
  }

  return Path.basename(path);
}

async function getImmediateSiblings(path: string): Promise<Array<string>> {
  let base = Path.dirname(path);
  let filename = Path.basename(path);
  let rawSiblings = await Bluebird.promisify(fs.readdir)(base);

  // TODO: filter the result based on whether or not we can actually read it.
  let siblings = rawSiblings.sort(natsort({insensitive: true}));
  let idx = siblings.indexOf(filename);

  let prev = idx > 0 ? siblings[idx - 1] : null;
  let next = idx < siblings.length - 1 ? siblings[idx + 1] : null;
  let immediates = [prev, next].map(x => {
    if (x != null) {
      return Path.join(base, x);
    }
    return null;
  });
  console.log("Siblings", immediates);
  return immediates;
}

export async function nextReadable(path: string): Promise<VirtualRoot> {
  let siblings = await getImmediateSiblings(path);
  if (siblings[1] == null) {
    return null;
  }
  return await readThing(siblings[1]);
}

export async function prevReadable(path: string): Promise<VirtualRoot> {
  let siblings = await getImmediateSiblings(path);
  if (siblings[0] == null) {
    return null;
  }
  return await readThing(siblings[0]);
}
