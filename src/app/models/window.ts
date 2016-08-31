import {observable, computed} from "mobx";
import {getListener} from "../../events";
import IPC from "../../ipc";

// This model serves as an entrypoint for some window/process related values
// to the mobx lifecycle.

class WindowStateTemplate {
  @observable width: number = window.screen.width;
  @observable height: number = window.screen.height;

  @observable isHtmlFullScreen: boolean = document.webkitIsFullScreen;
  @observable isHostFullScreen: boolean = false;

  @computed
  get isFullScreen() {
    return this.isHostFullScreen || this.isHtmlFullScreen;
  }

  constructor() {
    let hostEmitter = getListener();
    // Fullscreen stuff.
    hostEmitter.on("enter-full-screen", () => {
      this.isHostFullScreen = true;
    });
    hostEmitter.on("leave-full-screen", () => {
      this.isHostFullScreen = false;
    });
    hostEmitter.on("enter-html-full-screen", () => {
      this.isHtmlFullScreen = true;
    });
    hostEmitter.on("leave-html-full-screen", () => {
      this.isHtmlFullScreen = false;
    });
    // Initial value.
    IPC.isFullScreen().then((x) => this.isHostFullScreen = x);
  }
}

export default new WindowStateTemplate();
