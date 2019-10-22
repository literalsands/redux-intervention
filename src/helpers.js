export const resolve = next => value =>
  value instanceof Promise ? value.then(next) : next(value);
