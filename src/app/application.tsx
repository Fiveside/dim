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
  async handleButtonClick(event: React.MouseEvent) {
    console.log("Clicked the button.");
    try {
      let folder = await IPC.launchBrowser();
      this.state.viewer.load(folder);
      // await this.state.viewer.load("someshit");
      // this.setState({
      //   folder: await IPC.launchBrowser(),
      // });
    } catch (err) {
      console.log("No file chosen");
      // this.setState({folder: null});
    }
  }

  render() {
    let btn = <button onClick={this.handleButtonClick}>Select Folder</button>;
    console.log("Rendering", this.state.viewer.isLoaded);
    if (!this.state.viewer.isLoaded) {
      return btn;
    }
    return (
      <div>
        You chose folder {this.state.viewer.archivePath}
        <Viewport viewer={this.state.viewer} />
        {btn}
      </div>
    );
  }
}
