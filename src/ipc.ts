import * as Electron from "electron";
import * as _ from "lodash";

interface IPCHandler {
  name: string;
  action(data: any): Promise<any>;
}

abstract class LaunchBrowser {
  browser: Electron.BrowserWindow;
  constructor(browser: Electron.BrowserWindow) {
    this.browser = browser;
  }
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

interface PromiseResolver {
  resolve(data: any): void;
  reject(data: any): void;
}
interface MessageMap {
  [name: string]: Map<string, PromiseResolver>;
}
const messages: MessageMap = {};

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
    let map = messages[name];

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

function makeIPC(handler: IPCHandler): WrappedHandler {
  let wrapper = <WrappedHandler>function(data?: any): Promise<any> {
    let tempid = _.uniqueId("ipc_");
    let handlers = messages[handler.name];
    if (handlers == null) {
      messages[handler.name] = handlers = new Map();
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
};
export default listeners;

export function initIPCListeners() {
  _.values(listeners).forEach((handler: WrappedHandler) => {
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
