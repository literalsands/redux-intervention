const identity = store => next => action => next(action);

// Mutate a pile of promises.
export const keepPromises = (keep = []) => promise => {
  keep.push(promise);
  promise.finally(() => {
    const index = keep.indexOf(promise);
    keep.splice(index, index + 1 ? 1 : 0);
  });
  return keep;
};

/**
 * Wraps a middleware in a Promise that returns when
 * the next middleware is called.
 *
 * @param {middlewares} middleware
 */
export const asPromise = middleware => store => {
  const middlewareWithStore = middleware(store);
  return next => action =>
    new Promise((resolve, reject) => {
      try {
        const dispatchReturn = middlewareWithStore(action =>
          resolve(next(action))
        )(action);
        // Capture asynchonous errors in the current middleware.
        if (dispatchReturn instanceof Promise) {
          dispatchReturn.catch(reject);
        }
      } catch (e) {
        // Capture synchonous errors in the current or next middleware.
        reject(e);
      }
    });
};

/**
 * Wraps all the middlewares in Promises that resolve
 * when the next middleware has been called.
 *
 * @param {...middlewares} middlewares
 */
const withPromise = (...middlewares) => {
  const unresolvedPromises = [];
  const middleware = function(store) {
    if (middlewares.length === 0) middlewares = [identity];
    const reversedMiddlewaresWithStore = middlewares
      .map(asPromise)
      .map(middleware => middleware(store))
      .reverse();
    return next =>
      reversedMiddlewaresWithStore.reduce(
        // Hook into the promise so we can reject them all in the future.
        (next, middleware) => middleware(next),
        next
      );
  };
  middleware.abort = store => next => action => {
    const reject = unresolvedPromises.splice(0, unresolvedPromises.length);
    reject.forEach(promise => promise.reject());
  };
  return middleware;
};

export default withPromise;
