/**
 * Policies dictate order of execution and the return value of the middleware.
 *
 * Dispatches can be made using the return value of the context or next execution.
 *
 * @function Policy
 * @param {function} context - The current middleware, with store and the current action bound.
 * @param {function} next - The next middleware, with store and it's next function and the current action bound.
 * @returns {function} Returns a function that takes an action, and optionally the state.
 */

/**
 * @function createPolicy
 * @param {Policy}
 * @returns createPolicyMiddleware
 */
export const policy = _policy =>
  /**
   * @function createPolicyMiddleware
   * @param {Middleware}
   * @returns Middleware
   */
  middleware => store => {
    const context = middleware(store);
    return next => _action =>
      _policy(
        // Bind since we're not an effect.
        next => (action = _action) => context(next)(action),
        // Bind since we're not a scope.
        (action = _action) => next(action)
      );
  };

// policy((context, next) => {
//   return new Promise(resolve => context(() => resolve(next())()));
// })(scope(a => a + 1));

// policy((context, next) => {
//   return new Promise(resolve => context(resolve)()).then(next);
// })(scope(a => a + 1));

// export const clip = policy(context => context(() => {}));

// export const noscope = policy((context, next) => action =>
//   context(() => next(action))(action)
// );

// export const pass = policy((context, next) => {
//   return context(next);
// });

// export const promiseNext = policy((context, next) => action =>
//   new Promise(resolve => context(() => resolve(next(action)))(action))
// );

// export const scopeInner = reducer => (...middleware) =>
//   noscope(chain(scope(reducer), ...middleware));
