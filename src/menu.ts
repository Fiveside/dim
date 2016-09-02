import * as Electron from "electron";
import {sendEventToRenderProcess} from "./events";

function announce(eventName: string) {
  return function(menuItem: Electron.MenuItem, bw: Electron.BrowserWindow) {
    sendEventToRenderProcess(bw, eventName, null);
  }
}

const menu = Electron.Menu.buildFromTemplate([
  {
    label: "File",
    submenu: [
      {
        label: "Open File",
        click: announce("open-file"),
      },
      {
        label: "Open Folder",
        click: announce("open-folder"),
      },
      {
        label: "Close Chapter",
        click: announce("unload-viewer"),
      },
      {
        type: "separator",
      },
      {
        role: "close",
      }
    ]
  }
]);

export default menu;
