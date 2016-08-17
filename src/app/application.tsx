import * as React from "react";
import * as Electron from "electron";
import IPC from "../ipc";
import {autobind} from "core-decorators";
import ViewerModel from "./models/viewer";
import Viewport from "./viewport";
import {observer} from "mobx-react";

interface IApplicationState {
  viewer: ViewerModel;
}

@observer
export default class Application extends React.Component<any, IApplicationState> {

  state: IApplicationState = {
    viewer: new ViewerModel(),
  };

  @autobind
  async handleLoad(event: React.MouseEvent) {
    try {
      let folders = await IPC.launchBrowser();
      console.log(folders);
      this.state.viewer.load(folders[0]);
    } catch (err) {
      console.log("No file chosen");
    }
  }

  @autobind
  async handleUnload(event: React.MouseEvent) {
    console.log("Unloading");
    this.state.viewer.unload();
  }

  render() {
    let btn = <button onClick={this.handleLoad}>Select Folder</button>;
    if (!this.state.viewer.isLoaded) {
      return btn;
    }
    return (
      <div className="application">
        <div className="top-menu">
          {this.state.viewer.archivePath}
          {btn}
          <button onClick={this.handleUnload}>Unload</button>
        </div>
        <Viewport viewer={this.state.viewer} />
      </div>
    );
  }
}
