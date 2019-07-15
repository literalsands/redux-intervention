export const runCases = middlewares => store => next => action => {
  const middleware = middlewares[action.type];
  if (middleware instanceof Function) {
    middleware(store)(next)(action);
  } else {
    next(action);
  }
};

export const combineCases = function(...middlewaresWithCases) {
  return middlewaresWithCases
    .reduce(
      (arrayCases, objectOrArray) =>
        arrayCases.concat(
          Array.isArray(objectOrArray)
            ? Array.isArray(objectOrArray[0])
              ? objectOrArray
              : [objectOrArray]
            : objectOrArray instanceof Function
            ? (() => {
                const entries = Object.entries(objectOrArray);
                if (entries.length === 0) {
                  return [[objectOrArray]];
                }
                return entries.map(([_case, reducer]) => [reducer, _case]);
              })()
            : Object.entries(objectOrArray).map(([_case, reducer]) => [
                reducer,
                _case
              ])
        ),
      []
    )
    .reduce((middlewares, [middleware, ...cases]) => {
      if (cases.length === 0) {
        Object.entries(middlewares).forEach(([_case, current]) => {
          middlewares[_case] = store => next =>
            current(store)(middleware(store)(next));
        });
      } else {
        cases.forEach(_case => {
          const current = middlewares[_case];
          middlewares[_case] =
            current instanceof Function
              ? store => next => current(store)(middleware(store)(next))
              : middleware;
        });
      }
      return middlewares;
    }, {});
};

/**
 * Combines middlewares by action type casing for efficiency and bug prevention.
 *
 * @param  {...[middleware, ...cases]} middlewaresWithCases
 */
const combineMiddleware = (...middlewaresWithCases) => {
  const middlewares = combineCases(...middlewaresWithCases);
  return Object.assign(function(store) {
    return next => runCases(middlewares)(store)(next);
  }, middlewares);
};

export default combineMiddleware;
