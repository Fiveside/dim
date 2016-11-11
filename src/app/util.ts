import * as rx from "rxjs";

// There has got to be a nicer way of doing this.
export function toMulticast<T>(obs: rx.Observable<T>): rx.Observable<T> {
  let subject = new rx.Subject();
  let multicast = obs.multicast(subject);
  multicast.connect();
  return multicast;
}
