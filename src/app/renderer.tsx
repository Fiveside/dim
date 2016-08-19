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
  paint: {(): void};
  disposer: {(): void};

  constructor() {
    super();
    this.paint = throttleAnimationFrame(this._paint.bind(this));
  }

  componentDidMount() {
    this.disposer = autorun(() => {
      // Touch some props so that mobx knows what to observe for this
      this.props.file.isLoaded;

      this.paint();
    });
    window.addEventListener("resize", this.onResize);
  }

  componentWillUnmount() {
    this.disposer();
    window.removeEventListener("resize", this.onResize);
  }

  componentDidUpdate() {
    this.paint();
  }

  // use this.paint, that throttles on animation frame.
  _paint() {
    let canvas = this.refs.canvas;
    let bbox = canvas.getBoundingClientRect();
    canvas.width = bbox.width;
    canvas.height = bbox.height;

    let ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let file = this.props.file;
    if (!file.isLoaded) {
      console.log("Image not loaded, cannot paint");
      return;
    }
    let img = file.image;

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
    ctx.drawImage(file.image, target.x, target.y, target.width, target.height);
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
