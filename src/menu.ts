import * as Electron from "electron";
import * as Actions from "./ipc";
import {Direction, LayoutPages, LayoutStyle} from "./layout";

function announce(eventName: string, ...data: Array<any>) {
  return function(menuItem: Electron.MenuItem, bw: Electron.BrowserWindow) {
    console.warn("using old thingy, upgrade this.");
  };
}

function invokeAction(action: Actions.Action, ...args: any[]) {
  return function(menuItem: Electron.MenuItem, bw: Electron.BrowserWindow) {
    action(bw, ...args);
  };
}

function buildInitialMenu(): Electron.Menu {
  return Electron.Menu.buildFromTemplate([
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
          label: "Reading Direction",
          submenu: [
            {
              label: "Left to Right",
              type: "radio",
              click: invokeAction(Actions.setLayoutDirection, Direction.LTR),
            },
            {
              label: "Right to Left",
              type: "radio",
              click: invokeAction(Actions.setLayoutDirection, Direction.RTL),
            }
          ]
        },
        {
          label: "Pages to Display",
          submenu: [
            {
              label: "One page",
              type: "radio",
              click: invokeAction(Actions.setLayoutPageNumbers, LayoutPages.Single),
            },
            {
              label: "Two pages",
              type: "radio",
              click: invokeAction(Actions.setLayoutPageNumbers, LayoutPages.Double),
            },
            {
              label: "Adaptive",
              type: "radio",
              click: invokeAction(Actions.setLayoutPageNumbers, LayoutPages.Smaht),
            }
          ]
        },
        {
          type: "separator",
        },
        {
          label: "Fit 100%",
          type: "radio",
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
      ],
    },
  ]);
}

// Cache the window with the menu template so that instances can modify
// the menu.
const MENU_CACHE = new WeakMap<Electron.BrowserWindow, Electron.Menu>();

export function linkMenu(bw: Electron.BrowserWindow) {
  let menu = buildInitialMenu();
  bw.setMenu(menu);
  MENU_CACHE.set(bw, menu);
}

function getMenu(bw: Electron.BrowserWindow): Electron.Menu {
  let menu = MENU_CACHE.get(bw);
  if (menu == null) {
    console.error("Failed to retrieve menu...");
    throw new Error("Failed to retrieve menu, perhaps it was GCed?");
  }
  return menu;
}

export function setLayoutDirection(bw: Electron.BrowserWindow, direction: Direction) {
  let menu = getMenu(bw);
  let [ltr, rtl] = (<Electron.Menu>
    (<Electron.Menu>menu.items[1].submenu).items[0].submenu
  ).items;

  let isLTR = direction === Direction.LTR;
  ltr.checked = isLTR;
  rtl.checked = !isLTR;

  bw.setMenu(menu);
}

export function setLayoutPageNumbers(bw: Electron.BrowserWindow, pages: LayoutPages) {
  let menu = getMenu(bw);
  let [single, double, smart] = (<Electron.Menu>
    (<Electron.Menu>menu.items[1].submenu).items[1].submenu
  ).items;

  single.checked = pages === LayoutPages.Single;
  double.checked = pages === LayoutPages.Double;
  smart.checked = pages === LayoutPages.Smaht;

  bw.setMenu(menu);
}

export function setLayoutStyle(bw: Electron.BrowserWindow, style: LayoutStyle) {
  let menu = getMenu(bw);
  let [fit] = (<Electron.Menu>menu.items[1].submenu).items.slice(2);

  fit.checked = style === LayoutStyle.Fit;
  bw.setMenu(menu);
}
