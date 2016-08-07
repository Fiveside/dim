import * as React from "react";
import * as Electron from "electron";
import IPC from "../ipc";
import {autobind} from "core-decorators";
import ViewerModel from "./models/viewer";
import Viewer from "./viewer";
// import * as Mobx from "mobx";

interface ApplicationState {
  folder?: string;
  viewer: ViewerModel;
}

export default class Application extends React.Component<{}, {}> {

  state: ApplicationState = {
    folder: null,
    viewer: new ViewerModel(),
  };

  @autobind
  async handleButtonClick(event: React.MouseEvent) {
    console.log("Clicked the button.");
    try {
      this.setState({
        folder: await IPC.launchBrowser(),
      });
    } catch (err) {
      console.log("No file chosen");
      this.setState({folder: null});
    }
  }

  render() {
    let btn = <button onClick={this.handleButtonClick}>Select Folder</button>;
    if (this.state.folder == null) {
      return btn;
    }
    return (
      <div>
        You chose folder {this.state.folder}
        <Viewer viewer={this.state.viewer} />
        {btn}
      </div>
    );
  }
}
