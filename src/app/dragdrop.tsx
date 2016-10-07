import * as React from "react";
import {autobind} from "core-decorators";

const cx = require("classnames");

interface IDragDropUploaderProps {
  onUpload: {(): void};
}

interface IDragDropUploaderRefs {
  [key: string]: React.ReactInstance;
  drop: HTMLDivElement;
}

interface IDragDropUploaderState {
  isDragging: boolean;
}

export default class DragDropUploader extends React.Component<IDragDropUploaderProps, IDragDropUploaderState> {
  refs: IDragDropUploaderRefs;

  state = {
    isDragging: false,
  };

  // onDragEnter() {
  //   console.log("onDragEnter");
  // }

  // onDragLeave() {
  //   console.log("onDragLeave");
  // }

  @autobind
  onGlobalDragEnter(e: DragEvent) {
    let d = this.state.isDragging;
    this.setState({isDragging: true});
    console.log("Drag Event!", d, this.state.isDragging);
  }

  componentDidMount() {
    window.addEventListener("dragenter", this.onGlobalDragEnter);
    // window.addEventListener("dragleave", (e: DragEvent) => {
    //   console.log("Drag leave!", e.target);
    //   this.setState({isDragging: false});
    // });
  }

  @autobind
  onDragLeave(e: React.DragEvent) {
    let d = this.state.isDragging;
    // this.setState({isDragging: false});
    console.log("element drag leave.", d, this.state.isDragging);
  }

  @autobind
  onDrop(e: React.DragEvent) {
    e.preventDefault();
    console.log("DROPPED!");
  }

  componentWillUnmount() {
  }

  render(): JSX.Element {
    const className = cx({
      dropzone: true,
      hidden: !this.state.isDragging,
    });

    return (
      <div ref="drop" className={className}
                      onDragLeave={this.onDragLeave}
                      onDrop={this.onDrop}
      >
        Hello from the dropzone
      </div>
    );
    // return (
    //   <form ref="form"
    //         onDrag={onLog("onDrag")}
    //         onDragEnter={onLog("onDragEnter")}
    //         onDragLeave={onLog("onDragLeave")}
    //         onDragExit={onLog("onDragExit")}
    //         onDragOver={onLog("onDragOver")}
    //         onDrop={onLog("onDrop")}
    //   >
    //     <div>Hello from uploader</div>
    //   </form>
    // );
  }
}
