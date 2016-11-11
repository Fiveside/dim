import * as Electron from "electron";

// import * as EventEmitter from "events";
const EventEmitter = require("events");

const CALLBACKS: Array<{name: string, cb: Electron.IpcMainEventListener}> = [];
function register(name: string, cb: Electron.IpcMainEventListener) {
  CALLBACKS.push({
    name: name,
    cb: cb,
  });
}

export function initIPCHostListeners() {
  for (let {name, cb} of CALLBACKS) {
    Electron.ipcMain.on(name, cb);
  }
}

// Message definitions, avoiding magic strings.
export const MESSAGE = {
  toGuest: {
    OpenFile: "disk:open-file", // File opened.
    OpenFolder: "disk:open-folder", // Folder opened.
  },
  toHost: {
    OpenFile: "messagebox:open-file", // Request file picker.
    OpenFolder: "messagebox:open-folder", // Request folder picker.
    SetFullScreen: "window:set-full-screen", // Declare new fullscreen state.
    ToggleFullScreen: "window:toggle-full-screen", // Switch fullscreen state.
  },
};

function genericFilePicker(
      sender: Electron.WebContents,
      options: Electron.OpenDialogOptions,
      returnName: string) {

  let bw = Electron.BrowserWindow.fromWebContents(sender);
  Electron.dialog.showOpenDialog(bw, options, (filenames: string[]) => {
    console.log("showOpenDialog returned", typeof filenames, filenames);
    if (filenames != null && filenames.length > 0) {
      // We have filenames!
      console.log("Returning to guest.", returnName, filenames[0]);
      sender.send(returnName, filenames[0]);
    }
  });
}

register(
  MESSAGE.toHost.OpenFile,
  (event: Electron.IpcMainEvent, returnEventName?: string) => {
    const options: Electron.OpenDialogOptions = {
      filters: [
        {name: "Archives", extensions: ["zip", "cbz", "rar", "cbr"]},
        {name: "All Files", extensions: ["*"]},
      ],
      properties: ["openFile"],
    };
    genericFilePicker(event.sender, options, returnEventName || MESSAGE.toGuest.OpenFile);
  }
);

register(
  MESSAGE.toHost.OpenFolder,
  (event: Electron.IpcMainEvent, returnEventName?: string) => {
    const options: Electron.OpenDialogOptions = {
      properties: ["openDirectory"],
    };
    genericFilePicker(event.sender, options, returnEventName || MESSAGE.toGuest.OpenFolder);
  }
);

function setFullScreen(bw: Electron.BrowserWindow, mode: boolean) {
  bw.setMenuBarVisibility(!mode);
  bw.setFullScreen(mode);
}

register(MESSAGE.toHost.SetFullScreen, (event: Electron.IpcMainEvent, mode: boolean) => {
  let bw = Electron.BrowserWindow.fromWebContents(event.sender);
  setFullScreen(bw, mode);
});

register(MESSAGE.toHost.ToggleFullScreen, (event: Electron.IpcMainEvent) => {
  let bw = Electron.BrowserWindow.fromWebContents(event.sender);
  let mode = !bw.isFullScreen();
  setFullScreen(bw, mode);
});
