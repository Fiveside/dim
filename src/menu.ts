import * as Electron from "electron";
import {sendEventToRenderProcess} from "./events";

function announce(eventName: string) {
  return function(menuItem: Electron.MenuItem, bw: Electron.BrowserWindow) {
    sendEventToRenderProcess(bw, eventName, null);
  };
}

const menu = Electron.Menu.buildFromTemplate([
  {
    label: "File",
    submenu: [
      {
        label: "Open File",
        click: announce("menu:open-file"),
      },
      {
        label: "Open Folder",
        click: announce("menu:open-folder"),
      },
      {
        label: "Close Chapter",
        click: announce("menu:unload-viewer"),
      },
      {
        label: "Toggle Full Screen",
        accelerator: (function() {
          if (process.platform === "darwin")
            return "Ctrl+Command+F";
          else
            return "F11";
        })(),
        click: announce("menu:toggle-full-screen"),
      },
      {
        type: "separator",
      },
      {
        role: "close",
      }
    ]
  },
  {
  label: "Developer",
  submenu: [
    {
      label: "Reload",
      accelerator: "CmdOrCtrl+R",
      click: (item, bw) => bw.reload()
    },
    {
      label: "Toggle Developer Tools",
      accelerator: (function() {
        if (process.platform === "darwin")
          return "Alt+Command+I";
        else
          return "Ctrl+Shift+I";
      })(),
      click: (item, bw) => bw.webContents.toggleDevTools(),
    },
  ]
},
]);

export default menu;
