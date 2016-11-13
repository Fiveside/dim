import * as Electron from "electron";
import {Direction, LayoutPages, LayoutStyle} from "./layout";
import * as Menu from "./menu";

export interface Action {
  (bw: Electron.BrowserWindow, ...data: any[]): void;
}

function ipcToAction(cb: {(bw: Electron.BrowserWindow, ...data: any[]): void}) {
  return (event: Electron.IpcMainEvent, ...data: any[]) =>
    cb(Electron.BrowserWindow.fromWebContents(event.sender), ...data);
}

const CALLBACKS: Array<{name: string, cb: Electron.IpcMainEventListener}> = [];

// Registers and returns an action.  Useful for actions that can be directly
// called from the host process.
function register<T extends Action>(name: string, cb: T) {
  CALLBACKS.push({
    name: name,
    cb: ipcToAction(cb),
  });
  return cb;
}

// Registers a direct ipc listener.  Required for synchronous IPC.
function registerRaw(name: string, cb: Electron.IpcMainEventListener) {
  CALLBACKS.push({
    name: name,
    cb: cb,
  });
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
    LayoutPage: "layout:page-style", // Number of pages in layout.
    LayoutDirection: "layout:direction", // Reading direction
    LayoutStyle: "layout:style", // Layout style (100% fit)
  },
  toHost: {
    OpenFile: "messagebox:open-file", // Request file picker.
    OpenFolder: "messagebox:open-folder", // Request folder picker.
    IsFullscreen: "window:is-full-screen", // Sync call, is fullscreen.
    SetFullScreen: "window:set-full-screen", // Declare new fullscreen state.
    ToggleFullScreen: "window:toggle-full-screen", // Switch fullscreen state.
    LayoutPage: "layout:page-style", // Switch number of pages in layout
    LayoutDirection: "layout:direction", // Switch reading direction
    LayoutStyle: "layout:style", // Layout style
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

registerRaw(MESSAGE.toHost.IsFullscreen, (event: Electron.IpcMainEvent) => {
  let bw = Electron.BrowserWindow.fromWebContents(event.sender);
  event.returnValue = bw.isFullScreen();
});

// Layout functions
export function setLayoutDirection(bw: Electron.BrowserWindow, direction: Direction) {
  bw.webContents.send(MESSAGE.toGuest.LayoutDirection, direction);
}
register(MESSAGE.toHost.LayoutDirection,
(bw: Electron.BrowserWindow, direction: Direction) => {
  Menu.setLayoutDirection(bw, direction);
});

export function setLayoutStyle(bw: Electron.BrowserWindow, style: LayoutStyle) {
  bw.webContents.send(MESSAGE.toGuest.LayoutStyle, style);
}
register(MESSAGE.toHost.LayoutStyle,
(bw: Electron.BrowserWindow, style: LayoutStyle) => {
  Menu.setLayoutStyle(bw, style);
});

export function setLayoutPageNumbers(bw: Electron.BrowserWindow, pages: LayoutPages) {
  bw.webContents.send(MESSAGE.toGuest.LayoutPage, pages);
}
register(MESSAGE.toHost.LayoutPage,
(bw: Electron.BrowserWindow, pages: LayoutPages) => {
  Menu.setLayoutPageNumbers(bw, pages);
});
