// RequestAnimationFrame throttling
// param is a DOMHighResTimeStamp
interface IthrottleAnimationFrameCallback {(x?: number): any; }
export function throttleAnimationFrame(callback: IthrottleAnimationFrameCallback) {
  let running = false;
  return function() {
    if (running) {
      return;
    }
    running = true;
    window.requestAnimationFrame(function() {
      try {
        callback.apply(null, arguments);
      } finally {
        running = false;
      }
    });
  };
}
