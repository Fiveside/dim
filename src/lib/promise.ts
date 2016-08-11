// Promise shenannigans
export interface IUnwrappedPromise<T> {
  promise: Promise<T>;
  resolve(sucess: T): void;
  reject(error: any): void;
}
export function unwrapped<T>(): IUnwrappedPromise<T> {
  let x: any = {};
  x.promise = new Promise<T>((resolve, reject) => {
    x.resolve = resolve;
    x.reject = reject;
  });
  return <IUnwrappedPromise<T>>x;
}
