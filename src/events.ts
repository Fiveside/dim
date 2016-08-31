import * as Electron from "electron";
import {EventEmitter} from "events";
// const events = require("events");

// These are events emitted by the window process that should be pumped
// into the render process.

// names of events to forward.
const EVENT_NAMES: Array<string> = [
  "page-title-updated",
  "blur",
  "focus",
  "enter-full-screen",
  "leave-full-screen",
  "enter-html-full-screen",
  "leave-html-full-screen",
];

interface HostMessage {
  name: string;
  // args: any[];
}

export function initEvents(bw: Electron.BrowserWindow) {
  for (let name of EVENT_NAMES) {
    bw.on(name, function() {
      bw.webContents.send("host-event", <HostMessage>{
        name: name,
        // args: Array.prototype.slice.call(arguments),
      });
    });
  }
}

let emitter: EventEmitter = null;
export function getListener(): EventEmitter {
  if (emitter != null) {
    return emitter;
  }

  emitter = new EventEmitter();
  Electron.ipcRenderer.on("host-event", (event: Electron.IpcRendererEvent, msg: HostMessage) => {
    emitter.emit(msg.name);
  });
  return emitter;
}
