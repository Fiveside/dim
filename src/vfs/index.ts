// Re-export a bunch of stuff
import * as Base from "./base";
import * as Zip from "./zip";
import * as Local from "./local";
import * as Path from "path";
import * as Bluebird from "bluebird";
import * as fs from "fs";
const natsort = require("natsort");

export * from "./base";
export * from "./zip";
export * from "./local";

// export const VirtualCollection = Base.VirtualCollection;
// export const VirtualPage = Base.VirtualPage;
// export const ZipCollection = Zip.ZipCollection;
// export const ZipPage = Zip.ZippedPage;
// export const FSCollection = Local.FSCollection;
// export const FSPage = Local.FSPage;

// export interface IVirtualPage extends Base.IVirtualPage {};

async function canReadArchive(filepath: string): Promise<boolean> {
  let stat = await Bluebird.promisify(fs.stat)(filepath);
  if (stat.isDirectory()) {
    // TODO: check and see if the folder has any readable files in it.
    return true;
  }
  if (Path.extname(filepath).toLowerCase() === ".zip") {
    // TODO: same as above.
    return true;
  }
  return false;
}

async function getImmediateSiblings(path: string): Promise<Array<string>> {
  let base = Path.dirname(path);

  let rawSiblings = await (Bluebird.promisify(fs.readdir)(base)
    .map((x) => Path.join(base, x))
    .filter(canReadArchive));

  // Filter entries based on whether or not we can open em.
  // Then sort them to align siblings.
  let siblings = rawSiblings.sort(natsort({insensitive: true}));

  let idx = siblings.indexOf(path);

  let prev = idx > 0 ? siblings[idx - 1] : null;
  let next = idx < siblings.length - 1 ? siblings[idx + 1] : null;
  let immediates = [prev, next];

  console.log("Siblings", immediates);
  return immediates;
}

export async function readThing(path: string): Promise<Base.VirtualCollection> {
  let stat: fs.Stats = await Bluebird.promisify(fs.stat)(path);
  if (stat.isDirectory()) {
    return await Local.FSCollection.openFolder(path);
  }
  return await Zip.ZipCollection.openZip(path);
}

export async function nextReadable(node: Base.VirtualCollection): Promise<Base.VirtualCollection> {
  let siblings = await getImmediateSiblings(node.location);
  if (siblings[1] == null) {
    return null;
  }
  return await readThing(siblings[1]);
}

export async function prevReadable(node: Base.VirtualCollection): Promise<Base.VirtualCollection> {
  let siblings = await getImmediateSiblings(node.location);
  if (siblings[0] == null) {
    return null;
  }
  return await readThing(siblings[0]);
}
