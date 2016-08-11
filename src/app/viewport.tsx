import * as React from "react";
import {observer} from "mobx-react";
import Viewer from "./models/viewer";

interface IViewportProps {
  viewer: Viewer;
}

@observer
export default class Viewport extends React.Component<IViewportProps, {}> {
  // static propTypes = {
  //   viewer: propTypes.objectOrObservableObject.isRequired,
  // };

  render() {
    // let img = new Image();
    // img.src = this.props.viewer.sourceUrl;
    return (
      <div>
        This is the main viewer
        <img src={this.props.viewer.sourceUrl} />
      </div>
    );
  }
}
