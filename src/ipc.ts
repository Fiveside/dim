import * as Electron from "electron";
import * as _ from "lodash";

// TODO: This file needs to be cleaned up, maybe something similar to
// events.ts

interface IPCHandler {
  name: string;
  action(data: any): Promise<any>;
  browser?: Electron.BrowserWindow;
}

class IPCHandlerBase {
  browser: Electron.BrowserWindow;
  constructor(browser: Electron.BrowserWindow) {
    this.browser = browser;
  }
}

abstract class LaunchBrowser extends IPCHandlerBase{
  action(data: any) {
    return new Promise((resolve, reject) => {
      Electron.dialog.showOpenDialog(this.browser, this.getDialogOptions(), (selection) => {
        if (selection == null) {
          reject(undefined);
        } else {
          resolve(selection);
        }
      });
    });
  }

  abstract getDialogOptions(): Electron.OpenDialogOptions;
}

class LaunchFileBrowser extends LaunchBrowser implements IPCHandler {
  name = "launch-file-browser";
  getDialogOptions(): Electron.OpenDialogOptions {
    return {
      filters: [
        {name: "Archives", extensions: ["zip"]},
      ],
      properties: ["openFile"],
    };
  }
}

class LaunchFolderBrowser extends LaunchBrowser implements IPCHandler {
  name = "launch-folder-browser";
  getDialogOptions(): Electron.OpenDialogOptions {
    return {
      properties: ["openDirectory"],
    };
  }
}

class FullScreenChecker extends IPCHandlerBase implements IPCHandler {
  name = "check-full-screen";
  action(): Promise<boolean> {
    return Promise.resolve(this.browser.isFullScreen());
  }
}

class FullScreenSetter extends IPCHandlerBase implements IPCHandler {
  name = "set-full-screen";
  action(mode: boolean): Promise<void> {
    this.browser.setAutoHideMenuBar(mode);
    this.browser.setFullScreen(mode);
    return Promise.resolve();
  }
}

class FullScreenToggler extends IPCHandlerBase implements IPCHandler {
  name = "toggle-full-screen";
  action(): Promise<void> {
    let mode = !this.browser.isFullScreen();
    this.browser.setAutoHideMenuBar(mode);
    this.browser.setFullScreen(mode);
    return Promise.resolve();
  }
}

interface PromiseResolver {
  resolve(data: any): void;
  reject(data: any): void;
}
interface MessageMap {
  [name: string]: Map<string, PromiseResolver>;
}
const MESSAGES: MessageMap = {};

interface IPCSendMessage {
  name: string;
  id: string;
  data: number;
}

interface IPCRecieveMessage {
  name: string;
  id: string;
  success: boolean;
  data: number;
}

function makeListener(name: string) {
  Electron.ipcRenderer.on(name, (event: Electron.IpcRendererEvent, message: IPCRecieveMessage) => {
    let map = MESSAGES[name];

    if (!map.has(message.id)) {
      console.error("recieved IPC message with no destination!", event, message);
      return;
    }

    let cb = map.get(message.id);
    map.delete(message.id);
    if (message.success) {
      cb.resolve(message.data);
    } else {
      cb.reject(message.data);
    }
  });
}

interface WrappedHandler {
  ipc: IPCHandler;
  (data?: any): Promise<any>;
}

// Accepts an IPC handler and returns a method that handles the communication
// to the host process to request the host process to perform the action.
// Inner function returns a promise once the action is complete.
function makeIPC(handler: IPCHandler): WrappedHandler {
  let wrapper = <WrappedHandler>function(data?: any): Promise<any> {
    let tempid = _.uniqueId("ipc_");
    let handlers = MESSAGES[handler.name];
    if (handlers == null) {
      MESSAGES[handler.name] = handlers = new Map();
      makeListener(handler.name);
    }

    return new Promise((resolve, reject) => {
      handlers.set(tempid, {
        resolve: resolve,
        reject: reject,
      });

      let message: IPCSendMessage = {
        id: tempid,
        name: handler.name,
        data: data,
      };
      Electron.ipcRenderer.send(handler.name, message);
    });
  };
  wrapper.ipc = handler;
  return wrapper;
}

let listeners = {
  launchFileBrowser: makeIPC(new LaunchFileBrowser(null)),
  launchFolderBrowser: makeIPC(new LaunchFolderBrowser(null)),
  isFullScreen: makeIPC(new FullScreenChecker(null)),
  setFullScreen: makeIPC(new FullScreenSetter(null)),
  toggleFullScreen: makeIPC(new FullScreenToggler(null)),
};
export default listeners;

export function initIPCListeners(bw: Electron.BrowserWindow) {
  _.values(listeners).forEach((handler: WrappedHandler) => {

    // This is the host application process.  Set the browser param.
    handler.ipc.browser = bw;

    Electron.ipcMain.on(handler.ipc.name, (event, message) => {
      handler.ipc.action(message.data)
      .then((resolveData) => {
        event.sender.send(handler.ipc.name, <IPCRecieveMessage>{
          name: message.name,
          id: message.id,
          success: true,
          data: resolveData,
        });
      }).catch((catchData) => {
        event.sender.send(handler.ipc.name, <IPCRecieveMessage>{
          name: message.name,
          id: message.id,
          success: false,
          data: catchData,
        });
      });
    });
  });
}
