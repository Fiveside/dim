import * as rx from "rxjs";

// There has got to be a nicer way of doing this.
export function toMulticast<T>(obs: rx.Observable<T>): rx.Observable<T> {
  let subject = new rx.Subject();
  let multicast = obs.multicast(subject);
  multicast.connect();
  return multicast;
}

export interface UnwrappedPromise<T> {
  promise: Promise<T>;
  resolve: {(t: T): void};
  reject: {(e: Error): void};
}
export function unwrappedPromise<T>(): UnwrappedPromise<T> {
  let x: UnwrappedPromise<T> = {
    promise: null,
    resolve: null,
    reject: null,
  };
  x.promise = new Promise((resolve, reject) => {
    x.resolve = resolve;
    x.reject = reject;
  });
  return x;
}
