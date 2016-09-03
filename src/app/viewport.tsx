import * as React from "react";
import {observer} from "mobx-react";
import Viewer from "./models/viewer";
import {KeybindManager} from "../lib/keybind";
import {autobind} from "core-decorators";
import Renderer from "./renderer";
import WindowState from "./models/window";
import IPC from "../ipc";

interface IViewportProps {
  viewer: Viewer;
}

interface IViewportRefs {
  [key: string]: React.ReactInstance;
  renderer: Renderer;
}

type AmbiguousEvent = React.MouseEvent | KeyboardEvent;

@observer
export default class Viewport extends React.Component<IViewportProps, {}> {

  refs: IViewportRefs;

  componentDidMount() {
    KeybindManager.activate("viewport", {
      "next_page": this.handleNextClick,
      "previous_page": this.handlePrevClick,
      "fullscreen": this.handleFullScreen,
    });
  }

  componentWillUnmount() {
    KeybindManager.deactivate("viewport");
  }

  @autobind
  async handleFullScreen(event: KeyboardEvent) {
    await IPC.toggleFullScreen();
  }

  @autobind
  async handleNextClick(event: AmbiguousEvent) {
    this.props.viewer.nextPage();
  }

  @autobind
  async handlePrevClick(event: AmbiguousEvent) {
    this.props.viewer.previousPage();
  }

  @autobind
  async handlePrevChapter(event: AmbiguousEvent) {

  }

  @autobind
  async handleNextChapter(event: AmbiguousEvent) {
    this.props.viewer.nextChapter();
  }

  render() {
    return (
      <div className="viewport">
        <Renderer className="image-container"
                  ref="renderer"
                  file={this.props.viewer.currentPage}
                  onLeftClick={this.handleNextClick}
                  onRightClick={this.handlePrevClick}
        />
        <div className="bottom-menu" >
          <button onClick={this.handlePrevChapter}>Previous Chapter</button>
          <button onClick={this.handlePrevClick}>Previous Page</button>
          <span> {this.props.viewer.pageNumber + 1} of {this.props.viewer.pageTotal}</span>
          <button onClick={this.handleNextClick}>Next Page</button>
          <button onClick={this.handleNextChapter}>Next Chapter</button>
        </div>
      </div>
    );
  }
}
