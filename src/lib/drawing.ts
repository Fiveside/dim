
export function fit(toCanvas: HTMLCanvasElement, fromImage: HTMLImageElement) {
  let ctx = toCanvas.getContext("2d");
  ctx.clearRect(0, 0, toCanvas.width, toCanvas.height);

  // Draw the image so that it is centered on the canvas
  let target = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };
  let imgAr = fromImage.width / fromImage.height;
  let canvasAr = toCanvas.width / toCanvas.height;
  if (imgAr > canvasAr) {
    // image is wider than window
    target.width = toCanvas.width;
    target.height = fromImage.height * (toCanvas.width / fromImage.width);
    target.x = 0;
    target.y = (toCanvas.height / 2) - (target.height / 2);
  } else {
    // image is taller than window
    target.height = toCanvas.height;
    target.width = fromImage.width * (toCanvas.height / fromImage.height);
    target.y = 0;
    target.x = (toCanvas.width / 2) - (target.width / 2);
  }
  ctx.drawImage(fromImage, target.x, target.y, target.width, target.height);
}
