import * as React from "react";
import * as Electron from "electron";
import IPC from "../ipc";
import {autobind} from "core-decorators";
import ViewerModel from "./models/viewer";
import Viewport from "./viewport";
import {observer} from "mobx-react";
import WindowState from "./models/window";
import Title from "./title";
const cx = require("classnames");

interface IApplicationProps {
  viewer: ViewerModel;
}

@observer
export default class Application extends React.Component<IApplicationProps, {}> {

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
      this.props.viewer.load(files[0]);
    } catch (err) {
      console.log("No file chosen");
    }
  }

  getTitle() {
    let rootName = this.props.viewer.archiveName;
    let filename = this.props.viewer.currentPage.name;
    return `Dim <${rootName}> ${filename}`;
  }

  render() {
    if (!this.props.viewer.isLoaded) {
      return (
        <div className="top-menu">
          <Title title="Dim" />
          <button key="filePickerBtn_1" onClick={this.handleLoadFile}>Select File</button>
          <button key="filePickerBtn_2" onClick={this.handleLoadFolder}>Select Folder</button>
        </div>
      );
    }
    let appClass = {
      "application": true,
      "fullscreen": WindowState.isFullScreen,
    };
    return (
      <div className={cx(appClass)}>
        <Title title={this.getTitle()} />
        <Viewport viewer={this.props.viewer} />
      </div>
    );
  }
}
