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
      "next_chapter": this.handleNextChapter,
      "prev_chapter": this.handlePrevChapter,
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
    this.props.viewer.prevChapter();
  }

  @autobind
  async handleNextChapter(event: AmbiguousEvent) {
    this.props.viewer.nextChapter();
  }

  getPageNumbers(): string {
    let range = this.props.viewer.layout.currentPageRange.map(x => x + 1);
    if (range.length > 1) {
      return `${range[0]}-${range[range.length - 1]}`;
    } else {
      return range[0].toString();
    }
  }

  render() {
    return (
      <div className="viewport">
        <Renderer className="image-container"
                  ref="renderer"
                  layout={this.props.viewer.layout}
                  onLeftClick={this.handleNextClick}
                  onRightClick={this.handlePrevClick}
        />
        <div className="bottom-menu" >
          <button onClick={this.handlePrevChapter}>Previous Chapter</button>
          <button onClick={this.handlePrevClick}>Previous Page</button>
          <span> {this.getPageNumbers()} of {this.props.viewer.pageTotal}</span>
          <button onClick={this.handleNextClick}>Next Page</button>
          <button onClick={this.handleNextChapter}>Next Chapter</button>
        </div>
      </div>
    );
  }
}
