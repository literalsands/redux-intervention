/**
 *
 * @function createChainMiddleware
 * @param  {...any} middlewares
 */
export const chain = (...middlewares) =>
  middlewares.length === 0
    ? () => next => action => next(action)
    : middlewares.length === 1
    ? middlewares[0]
    : store => {
        const middlewaresWithState = middlewares
          .map(middleware => middleware(store))
          .reverse();
        return next =>
          middlewaresWithState.reduce(
            (_chain, middleware) => middleware(_chain),
            next
          );
      };

export const lift = middlewareCreator => (...args) => middleware =>
  chain(middlewareCreator(...args), middleware);
