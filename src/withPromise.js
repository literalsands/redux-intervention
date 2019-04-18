const identity = store => next => action => next(action);

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
        const dispatchReturn = middlewareWithStore(action => resolve(next(action)))(action);
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
const withPromise = (...middlewares) => store => {
  if (middlewares.length === 0) middlewares = [identity];
  const reversedMiddlewaresWithStore = middlewares
    .map(asPromise)
    .map(middleware => middleware(store))
    .reverse();
  return next =>
    reversedMiddlewaresWithStore.reduce(
      (next, middleware) => middleware(next),
      next
    );
};

export default withPromise;
