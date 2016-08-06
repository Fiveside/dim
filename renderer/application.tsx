import * as React from "react";
import * as Electron from "electron";

interface ApplicationState {
  folder?: string;
}

export default class Application extends React.Component<{}, {}> {

  state: ApplicationState = {
    folder: null,
  };

  handleButtonClick(event: React.MouseEvent) {
    // Electron.
    console.log("Clicked the button yo.");
  }

  render() {
    let btn = <button onClick={this.handleButtonClick}>Select Folder</button>;
    if (this.state.folder == null) {
      return btn;
    }
    return (
      <div>
        You chose folder {this.state.folder}
        {btn}
      </div>
    );
  }
}
