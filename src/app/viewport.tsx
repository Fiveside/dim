import * as React from "react";
import {observer} from "mobx-react";
import Viewer from "./models/viewer";
import {KeybindManager} from "../lib/keybind";
import {autobind} from "core-decorators";
import Renderer from "./renderer";

interface IViewportProps {
  viewer: Viewer;
}

@observer
export default class Viewport extends React.Component<IViewportProps, {}> {

  componentDidMount() {
    KeybindManager.activate("viewport", {
      "next_page": this.handleNextClick,
      "previous_page": this.handlePrevClick,
    });
  }

  componentWillUnmount() {
    KeybindManager.deactivate("viewport");
  }

  @autobind
  async handleNextClick(event: React.MouseEvent | KeyboardEvent) {
    this.props.viewer.nextPage();
  }

  @autobind
  async handlePrevClick(event: React.MouseEvent | KeyboardEvent) {
    this.props.viewer.previousPage();
  }

  render() {
    return (
      <div className="viewport">
        <Renderer className="image-container"
                  file={this.props.viewer.currentPage}
                  onLeftClick={this.handleNextClick}
                  onRightClick={this.handlePrevClick}
        />
        <div className="bottom-menu" >
          <button onClick={this.handlePrevClick}>Previous Page</button>
          <span> {this.props.viewer.pageNumber + 1} of {this.props.viewer.pageTotal}</span>
          <button onClick={this.handleNextClick}>Next Page</button>
        </div>
      </div>
    );
  }
}
