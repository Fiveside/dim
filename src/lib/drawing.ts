
// Paints the image on the canvas such that 100% of the image is visible
// on the canvas.
export type DrawSource = HTMLCanvasElement | HTMLImageElement;
export function fit(canvas: HTMLCanvasElement, source: DrawSource) {
  let ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the image so that it is centered on the canvas
  let target = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };
  let imgAr = source.width / source.height;
  let canvasAr = canvas.width / canvas.height;
  if (imgAr > canvasAr) {
    // image is wider than window
    target.width = canvas.width;
    target.height = source.height * (canvas.width / source.width);
    target.x = 0;
    target.y = (canvas.height / 2) - (target.height / 2);
  } else {
    // image is taller than window
    target.height = canvas.height;
    target.width = source.width * (canvas.height / source.height);
    target.y = 0;
    target.x = (canvas.width / 2) - (target.width / 2);
  }
  ctx.drawImage(source, target.x, target.y, target.width, target.height);
}

// Resizes the canvas to the dimensions of the image and paints it directly.
export function fullSize(canvas: HTMLCanvasElement, source: DrawSource) {
  canvas.width = source.width;
  canvas.height = source.height;

  let ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0);
}
