import * as React from "react";
import {observer} from "mobx-react";
import {IVirtualFile} from "../lib/vfs";
import {autobind} from "core-decorators";
import {throttleAnimationFrame} from "../lib/util";
import {autorun} from "mobx";
import * as Drawing from "../lib/drawing";

interface IRendererProps {
  className: string;
  file: IVirtualFile;
  onLeftClick: {(e: React.MouseEvent): any};
  onRightClick: {(e: React.MouseEvent): any};
}

interface ICanvasRendererRefs {
  [key: string]: React.ReactInstance;
  canvas: HTMLCanvasElement;
}

@observer
export default class CanvasRenderer extends React.Component<IRendererProps, {}> {

  refs: ICanvasRendererRefs;
  doPaint: {(...args: any[]): any | void};
  disposer: {(): void};

  constructor() {
    super();
    this.doPaint = throttleAnimationFrame(this._paint.bind(this));
  }

  componentDidMount() {
    this.disposer = autorun(this.paint.bind(this));
    window.addEventListener("resize", this.onResize);
  }

  paint() {
    // Touch some props so that mobx knows what to observe for this
    if (!this.props.file.isLoaded) {
      console.log("Image not loaded, cannot paint");
      return;
    }

    this.doPaint(this.props.file.image);
  }

  componentWillUnmount() {
    this.disposer();
    window.removeEventListener("resize", this.onResize);
  }

  componentDidUpdate() {
    this.paint();
  }

  // use this.paint, that throttles on animation frame.
  _paint(source: Drawing.DrawSource) {
    console.log("painting", this.props.file.name);

    // Because paint is called asynchronously, it may be called after the
    // component is dead.
    if (this.refs.canvas == null) {
      return;
    }

    let canvas = this.refs.canvas;
    let bbox = canvas.getBoundingClientRect();
    canvas.width = bbox.width;
    canvas.height = bbox.height;

    Drawing.fit(this.refs.canvas, source);
  }

  @autobind
  onResize() {
    console.log("Detected resize");
    this.paint();
  }

  @autobind
  onContextMenu(e: React.MouseEvent) {
    if (this.props.onRightClick) {
      this.props.onRightClick(e);
    }
  }

  @autobind
  onClick(e: React.MouseEvent) {
    if (this.props.onLeftClick) {
      this.props.onLeftClick(e);
    }
  }

  onMouseDown(e: React.MouseEvent) {
    // This prevents double clicking from selecting random text in the app.
    e.preventDefault();
  }

  render() {
    this.paint();
    return <canvas ref="canvas"
                   onContextMenu={this.onContextMenu}
                   onMouseDown={this.onMouseDown}
                   onClick={this.onClick}
                   className={this.props.className}
    />;
  }
}
