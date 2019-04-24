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
            : Object.entries(objectOrArray).map(([_case, reducer]) => [
                reducer,
                _case
              ])
        ),
      []
    )
    .reverse()
    .reduce((middlewares, [middleware, ...cases]) => {
      cases.forEach(_case => {
        const current = middlewares[_case];
        middlewares[_case] =
          current instanceof Function
            ? store => next => middleware(store)(current)
            : middleware;
      });
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
