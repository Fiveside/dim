// RequestAnimationFrame throttling
interface IthrottleAnimationFrameCallback {(...x: any[]): any; }
export function throttleAnimationFrame(callback: IthrottleAnimationFrameCallback) {
  let running = false;
  let lastArgs: Array<any> = [];
  return function(...args: any[]) {
    lastArgs = args;
    if (running) {
      return;
    }
    running = true;
    window.requestAnimationFrame(function() {
      try {
        callback.apply(null, lastArgs);
      } finally {
        running = false;
      }
    });
  };
}
