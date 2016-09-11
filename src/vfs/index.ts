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

async function canReadArchive(filepath: string): Promise<boolean> {
  let stat = await Bluebird.promisify(fs.stat)(filepath);
  if (stat.isDirectory()) {
    // TODO: check and see if the folder has any readable files in it.
    return true;
  }

  // Zip check.
  return await Zip.canRead(filepath);
}

async function getImmediateSiblings(path: string): Promise<Array<Array<string>>> {
  let base = Path.dirname(path);

  let rawSiblings = await (Bluebird.promisify(fs.readdir)(base)
    .map((x) => Path.join(base, x)));

  // Filter entries based on whether or not we can open em.
  // Then sort them to align siblings.
  let siblings = rawSiblings.sort(natsort({insensitive: true}));

  let idx = siblings.indexOf(path);

  let prev = siblings.slice(0, idx).reverse();
  let next = siblings.slice(idx + 1);
  let immediates = [prev, next];

  console.log("Siblings", immediates[0][0], immediates[1][0]);
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
  let [prev, next] = await getImmediateSiblings(node.location);

  for (let x of next) {
    if (await canReadArchive(x)) {
      return readThing(x);
    }
  }
  return null;
}

export async function prevReadable(node: Base.VirtualCollection): Promise<Base.VirtualCollection> {
  let [prev, next] = await getImmediateSiblings(node.location);

  for (let x of prev) {
    if (await canReadArchive(x)) {
      return readThing(x);
    }
  }
  return null;
}
