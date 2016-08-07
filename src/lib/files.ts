import * as yauzl from "yauzl";
import {DuVinylFile} from "./vfs";

export function readZip(path: string) {
  return [new DuVinylFile({
    cwd: "/",
    base: "/",
    path: "/foo.gif",
    contents: new Buffer("R0lGODlhAQABAAAAACH5BAEAAAAALAAAAAABAAEAAAI=", "base64"),
  })];
}
