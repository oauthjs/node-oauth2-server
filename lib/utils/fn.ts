const identity = (v: any) => v;

const reverser = (promise: Promise<any>) =>
  promise.then(v => Promise.reject(v), identity);

export const oneSuccess = (promises: Array<Promise<any>>) =>
  Promise.all(promises.map(reverser)).then(
    e => Promise.reject(AggregateError.from(e)),
    identity,
  );

export const hasOwnProperty = (o: any, k: string) =>
  Object.prototype.hasOwnProperty.call(o, k);

export class AggregateError extends Array implements Error {
  name = 'AggregateError';
  get message() {
    return this.map(e => e.message).join('\n');
  }
}
