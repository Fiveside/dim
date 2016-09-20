// const Pica = require("pica");

interface Target {
  // Location of the thing on the canvas.
  x: number;
  y: number;

  // Resolution
  width: number;
  height: number;
}

// Paints the image on the canvas such that 100% of the image is visible
// on the canvas.
export type DrawSource = HTMLCanvasElement | HTMLImageElement;
export async function fit(canvas: HTMLCanvasElement, source: DrawSource) {
  let ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the image so that it is centered on the canvas
  let target: Target = {
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
  // ctx.drawImage(source, target.x, target.y, target.width, target.height);

  let picaCanvas = document.createElement("canvas");
  picaCanvas.width = target.width;
  picaCanvas.height = target.height;

  ctx.drawImage(source, target.x, target.y, target.width, target.height);
  // await new Promise((resolve, reject) => {
  //   Pica.resizeCanvas(source, picaCanvas, {quality: 2}, function(err: string) {
  //     if (err != null) {
  //       reject(err);
  //       return;
  //     }
  //     ctx.drawImage(picaCanvas, target.x, target.y);
  //     resolve();
  //   });
  // });
}

// Resizes the canvas to the dimensions of the image and paints it directly.
export function fullSize(canvas: HTMLCanvasElement, source: DrawSource) {
  canvas.width = source.width;
  canvas.height = source.height;

  let ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0);
}

// // Javascript hermite resample.  Its a bit slow and of dubious quality.
// function resample_hermite(canvas, W, H, W2, H2){
//   W2 = Math.round(W2);
//   H2 = Math.round(H2);
//   var img = canvas.getContext("2d").getImageData(0, 0, W, H);
//   var img2 = canvas.getContext("2d").getImageData(0, 0, W2, H2);
//   var data = img.data;
//   var data2 = img2.data;
//   var ratio_w = W / W2;
//   var ratio_h = H / H2;
//   var ratio_w_half = Math.ceil(ratio_w/2);
//   var ratio_h_half = Math.ceil(ratio_h/2);

//   for(var j = 0; j < H2; j++){
//     for(var i = 0; i < W2; i++){
//       var x2 = (i + j*W2) * 4;
//       var weight = 0;
//       var weights = 0;
//       var weights_alpha = 0;
//       var gx_g, gx_b, gx_a;
//       var gx_r = gx_g = gx_b = gx_a = 0;
//       var center_y = (j + 0.5) * ratio_h;
//       for(var yy = Math.floor(j * ratio_h); yy < (j + 1) * ratio_h; yy++){
//         var dy = Math.abs(center_y - (yy + 0.5)) / ratio_h_half;
//         var center_x = (i + 0.5) * ratio_w;
//         var w0 = dy*dy //pre-calc part of w
//         for(var xx = Math.floor(i * ratio_w); xx < (i + 1) * ratio_w; xx++){
//           var dx = Math.abs(center_x - (xx + 0.5)) / ratio_w_half;
//           var w = Math.sqrt(w0 + dx*dx);
//           if(w >= -1 && w <= 1){
//             //hermite filter
//             weight = 2 * w*w*w - 3*w*w + 1;
//             if(weight > 0){
//             dx = 4*(xx + yy*W);
//               //alpha
//               gx_a += weight * data[dx + 3];
//               weights_alpha += weight;
//               //colors
//               if(data[dx + 3] < 255)
//                 weight = weight * data[dx + 3] / 250;
//               gx_r += weight * data[dx];
//               gx_g += weight * data[dx + 1];
//               gx_b += weight * data[dx + 2];
//               weights += weight;
//             }
//           }
//         }
//       }
//       data2[x2]     = gx_r / weights;
//       data2[x2 + 1] = gx_g / weights;
//       data2[x2 + 2] = gx_b / weights;
//       data2[x2 + 3] = gx_a / weights_alpha;
//     }
//   }
//   canvas.width = W2;
//   canvas.height = H2;
//   canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
//   canvas.getContext("2d").putImageData(img2, 0, 0);

//   return canvas;
// }
