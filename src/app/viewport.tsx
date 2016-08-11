import * as React from "react";
import {observer} from "mobx-react";
import Viewer from "./models/viewer";

interface IViewportProps {
  viewer: Viewer;
}

@observer
export default class Viewport extends React.Component<IViewportProps, {}> {
  render() {
    console.log("Rendering", this.props.viewer.currentPage.sourceUrl);
    return (
      <div>
        <img src={this.props.viewer.currentPage.sourceUrl} />
      </div>
    );
  }
}
