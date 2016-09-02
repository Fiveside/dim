import {observable, computed, autorun} from "mobx";
import {getListener} from "../../events";
import IPC from "../../ipc";

// This model serves as an entrypoint for some window/process related values
// to the mobx lifecycle.

class WindowStateTemplate {
  @observable width: number = window.screen.width;
  @observable height: number = window.screen.height;

  @observable isHtmlFullScreen: boolean = document.webkitIsFullScreen;
  @observable isHostFullScreen: boolean = false;

  // The title of the window.
  @observable title: string = "Dim";

  // If for some reason we ever need to destroy this object, call all these
  destructors: Array<() => void> = [];

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

    // Configure the title to be set whenever its updated.
    this.destructors.push(autorun(() => {
      document.title = this.title;
    }));
  }
}

export default new WindowStateTemplate();
