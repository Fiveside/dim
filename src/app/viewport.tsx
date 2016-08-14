import * as React from "react";
import {observer} from "mobx-react";
import Viewer from "./models/viewer";
import {KeybindManager} from "../lib/keybind";
import {autobind} from "core-decorators";

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
  async handleNextClick(event: Event) {
    this.props.viewer.nextPage();
  }

  @autobind
  async handlePrevClick(event: Event) {
    this.props.viewer.previousPage();
  }

  render() {
    return (
      <div>
        <div>
          <img className="fill-container" src={this.props.viewer.currentPage.sourceUrl} />
        </div>
        <span> Page {this.props.viewer.pageNumber} of {this.props.viewer.pageTotal}</span>
        <button onClick={this.handleNextClick}>Next Page</button>
        <button onClick={this.handlePrevClick}>Previous Page</button>
      </div>
    );
  }
}
