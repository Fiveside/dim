import * as Electron from "electron";
import {sendEventToRenderProcess} from "./events";
import * as Actions from "./ipc";

function announce(eventName: string, ...data: Array<any>) {
  return function(menuItem: Electron.MenuItem, bw: Electron.BrowserWindow) {
    sendEventToRenderProcess(bw, eventName, ...data);
  };
}

function invokeAction(action: Actions.Action, ...args: any[]) {
  return function(menuItem: Electron.MenuItem, bw: Electron.BrowserWindow) {
    action(bw, ...args);
  };
}

const menu = Electron.Menu.buildFromTemplate([
  {
    label: "File",
    submenu: [
      {
        label: "Open File",
        click: invokeAction(Actions.openFile),
      },
      {
        label: "Open Folder",
        click: invokeAction(Actions.openFolder),
      },
      {
        label: "Close Chapter",
        click: invokeAction(Actions.closeFile),
      },
      {
        label: "Toggle Full Screen",
        accelerator: (function() {
          if (process.platform === "darwin")
            return "Ctrl+Command+F";
          else
            return "F11";
        })(),
        click: invokeAction(Actions.toggleFullScreen),
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
    label: "Layout",
    submenu: [
      {
        label: "1 Page 100% Fit",
        type: "radio",
        click: announce("menu:layout", "single-page-fit"),
      },
      {
        label: "2 Page 100% Fit",
        type: "radio",
        click: announce("menu:layout", "dual-page-fit"),
      },
      {
        // What a terrible name.  Need to rename this.
        label: "Smart Multipage 100% Fit",
        type: "radio",
        click: announce("menu:layout", "smart-dual-page-fit"),
      },
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
