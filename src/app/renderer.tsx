import * as React from "react";
import {observer} from "mobx-react";
import {VirtualFile} from "../lib/vfs";
import {autobind} from "core-decorators";
import {throttleAnimationFrame} from "../lib/util";
import {autorun} from "mobx";

interface IRendererProps {
  className: string;
  file: VirtualFile;
}

interface ICanvasRendererRefs {
  [key: string]: React.ReactInstance;
  canvas: HTMLCanvasElement;
}

@observer
export default class CanvasRenderer extends React.Component<IRendererProps, {}> {

  refs: ICanvasRendererRefs;
  doPaint: {(): void};
  disposer: {(): void};

  constructor() {
    super();
    this.doPaint = throttleAnimationFrame(this._paint.bind(this));
  }

  componentDidMount() {
    this.disposer = autorun(this.paint.bind(this));
    window.addEventListener("resize", this.onResize);
  }

  async paint() {
      // Touch some props so that mobx knows what to observe for this
      if (!this.props.file.isLoaded) {
        console.log("Image not loaded, cannot paint");
        return;
      }

      console.log("rendering", this.props.file.name);
      // debugger;
      await this.props.file.load();
      this.doPaint(this.props.file.image, this.props.file.canvas);
  }

  componentWillUnmount() {
    this.disposer();
    window.removeEventListener("resize", this.onResize);
  }

  componentDidUpdate() {
    this.paint();
  }

  // use this.paint, that throttles on animation frame.
  _paint(img: HTMLImageElement, fromCanvas: HTMLCanvasElement) {
    // Because paint is called asynchronously, it may be called after the
    // component is dead.
    if (this.refs.canvas == null) {
      return;
    }

    let canvas = this.refs.canvas;
    let bbox = canvas.getBoundingClientRect();
    canvas.width = bbox.width;
    canvas.height = bbox.height;

    let ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);



    ctx.drawImage(fromCanvas, 0, 0);



    // Draw the image so that it is centered on the canvas
    let target = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    };
    let imgAr = img.width / img.height;
    let canvasAr = canvas.width / canvas.height;
    if (imgAr > canvasAr) {
      // image is wider than window
      target.width = canvas.width;
      target.height = img.height * (canvas.width / img.width);
      target.x = 0;
      target.y = (canvas.height / 2) - (target.height / 2);
    } else {
      // image is taller than window
      target.height = canvas.height;
      target.width = img.width * (canvas.height / img.height);
      target.y = 0;
      target.x = (canvas.width / 2) - (target.width / 2);
    }

    let start = new Date().getTime();
    console.log("before draw image", );
    ctx.drawImage(img, target.x, target.y, target.width, target.height);
    let end = new Date().getTime() - start;
    console.log("after draw image", end);
    // debugger;
  }

  @autobind
  onResize() {
    console.log("Detected resize");
    this.paint();
  }

  render() {
    this.paint();
    return <canvas className={this.props.className} ref="canvas" />;
  }
}
