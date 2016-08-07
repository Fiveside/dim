import * as React from "react";
import {propTypes, observer} from "mobx-react";
import Viewer from "./models/viewer";

interface MainViewerProps {
  viewer: Viewer;
}

@observer
export default class MainViewer extends React.Component<MainViewerProps, {}> {
  // static propTypes = {
  //   viewer: propTypes.objectOrObservableObject.isRequired,
  // };

  render() {
    let img = new Image();
    img.src = this.props.viewer.getSourceUrl();
    return (
      <div>
        This is the main viewer
        {img}
      </div>
    );
  }
}
