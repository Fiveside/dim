import * as Electron from "electron";

// import * as EventEmitter from "events";
const EventEmitter = require("events");

export interface Action {
  (bw: Electron.BrowserWindow, ...data: any[]): void;
}

function ipcToAction(cb: {(bw: Electron.BrowserWindow, ...data: any[]): void}) {
  return (event: Electron.IpcMainEvent, ...data: any[]) =>
    cb(Electron.BrowserWindow.fromWebContents(event.sender), ...data);
}

const CALLBACKS: Array<{name: string, cb: Electron.IpcMainEventListener}> = [];
function register<T extends Action>(name: string, cb: T) {
  CALLBACKS.push({
    name: name,
    cb: ipcToAction(cb),
  });
  return cb;
}

export function initIPCHostListeners(bw: Electron.BrowserWindow) {
  // Basic IPC responders
  for (let {name, cb} of CALLBACKS) {
    Electron.ipcMain.on(name, cb);
  }

  // Events from the host.
  function cast(name: string, ...args: any[]) {
    return () => bw.webContents.send(name, ...args);
  }
  bw.on("enter-full-screen", cast(MESSAGE.toGuest.Fullscreen, true));
  bw.on("leave-full-screen", cast(MESSAGE.toGuest.Fullscreen, false));
}

// Message definitions, avoiding magic strings.
export const MESSAGE = {
  toGuest: {
    OpenFile: "disk:open-file", // File opened.
    OpenFolder: "disk:open-folder", // Folder opened.
    CloseFile: "disk:close", // Close the current chapter.
    Fullscreen: "window:fullscreen", // Fullscreen state changed.
  },
  toHost: {
    OpenFile: "messagebox:open-file", // Request file picker.
    OpenFolder: "messagebox:open-folder", // Request folder picker.
    SetFullScreen: "window:set-full-screen", // Declare new fullscreen state.
    ToggleFullScreen: "window:toggle-full-screen", // Switch fullscreen state.
  },
};

function genericFilePicker(
      bw: Electron.BrowserWindow,
      options: Electron.OpenDialogOptions,
      returnName: string) {

  Electron.dialog.showOpenDialog(bw, options, (filenames: string[]) => {
    if (filenames != null && filenames.length > 0) {
      // We have filenames!
      bw.webContents.send(returnName, filenames[0]);
    }
  });
}

export const openFile = register(MESSAGE.toHost.OpenFile,
(bw: Electron.BrowserWindow, returnName: string = MESSAGE.toGuest.OpenFile) => {
  const options: Electron.OpenDialogOptions = {
    filters: [
      {name: "Archives", extensions: ["zip", "cbz", "rar", "cbr"]},
      {name: "All Files", extensions: ["*"]},
    ],
    properties: ["openFile"],
  };
  genericFilePicker(bw, options, returnName);
});

export const openFolder = register(MESSAGE.toHost.OpenFolder,
(bw: Electron.BrowserWindow, returnEventName: string = MESSAGE.toGuest.OpenFolder) => {
  const options: Electron.OpenDialogOptions = {
    properties: ["openDirectory"],
  };
  genericFilePicker(bw, options, returnEventName);
});

export function closeFile(bw: Electron.BrowserWindow) {
  bw.webContents.send(MESSAGE.toGuest.CloseFile);
}

export const setFullScreen = register(MESSAGE.toHost.SetFullScreen,
(bw: Electron.BrowserWindow, mode: boolean) => {
  bw.setMenuBarVisibility(!mode);
  bw.setFullScreen(mode);
});

export const toggleFullScreen = register(MESSAGE.toHost.ToggleFullScreen,
(bw: Electron.BrowserWindow) => {
  setFullScreen(bw, !bw.isFullScreen());
});
