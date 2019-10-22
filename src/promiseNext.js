import { policy } from "./policy";
import { chain } from "./chain";

/**
 * Wraps a middleware in a Promise that returns when
 * the next middleware is called.
 *
 * @param {middlewares} middleware
 */
export const promiseNext = policy(
  (context, next) =>
    new Promise((resolve, reject) => {
      try {
        const value = context(action => resolve(next(action)))();
        // Capture asynchonous errors in the current middleware.
        if (value instanceof Promise) {
          value.catch(reject);
        }
      } catch (e) {
        // Capture synchonous errors in the current or next middleware.
        reject(e);
      }
    })
);

/**
 * Wraps all the middlewares in Promises that resolve
 * when the next middleware has been called.
 *
 * @param {...middlewares} middlewares
 */
const promiseNextChain = (...middlewares) => promiseNext(chain(...middlewares.map(promiseNext)));

export default promiseNextChain;
