import * as React from "react";
import * as ReactDOM from "react-dom";
import Application from "./application";
import {getListener} from "../events";
import Viewer from "./models/viewer";
import IPC from "../ipc";

function bootstrap() {
  // Run initialization code here.

  // Register some event listeners for host operations.
  let listener = getListener();
  let viewer = new Viewer();

  listener.on("unload-viewer", () => {
    viewer.unload();
  });

  listener.on("open-file", async () => {
    try {
      let files = await IPC.launchFileBrowser();
      viewer.load(files[0]);
    } catch (err) {
      // do nothing!
    }
  });

  listener.on("open-folder", async () => {
    try {
      let folders = await IPC.launchFolderBrowser();
      viewer.load(folders[0]);
    } catch (err) {
      // do nothing!
    }
  });

  // Starts react and mounts it.
  ReactDOM.render(
    <Application viewer={viewer} />,
    document.getElementById("root")
  );
}

export default function init() {
  document.addEventListener("DOMContentLoaded", bootstrap);
}
