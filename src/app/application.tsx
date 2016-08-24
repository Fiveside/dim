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
  handleLoadFile(event: React.MouseEvent) {
    this.loadFile(IPC.launchFileBrowser());
  }

  @autobind
  handleLoadFolder(event: React.MouseEvent) {
    this.loadFile(IPC.launchFolderBrowser());
  }

  async loadFile(path: Promise<string>) {
    try {
      let files = await path;
      console.log("loading", files);
      this.state.viewer.load(files[0]);
    } catch (err) {
      console.log("No file chosen");
    }
    window.viewer = this.state.viewer;
  }

  @autobind
  async handleUnload(event: React.MouseEvent) {
    console.log("Unloading");
    this.state.viewer.unload();
  }

  render() {
    let btns = [
      <button key="filePickerBtn_1" onClick={this.handleLoadFile}>Select File</button>,
      <button key="filePickerBtn_2" onClick={this.handleLoadFolder}>Select Folder</button>,
    ];
    if (!this.state.viewer.isLoaded) {
      return (
        <div className="top-menu">
          {btns}
        </div>
      );
    }
    return (
      <div className="application">
        <div className="top-menu">
          {this.state.viewer.archivePath}
          {btns}
          <button onClick={this.handleUnload}>Unload</button>
        </div>
        <Viewport viewer={this.state.viewer} />
      </div>
    );
  }
}
