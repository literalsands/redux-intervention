export const runCases = middlewares => store => next => action => {
  const middleware = middlewares[action.type];
  if (middleware instanceof Function) {
    middleware(store)(next)(action);
  } else {
    next(action);
  }
};

export const combineCases = (...middlewaresWithCases) =>
  middlewaresWithCases
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

/**
 * Combines middlewares by action type casing for efficiency and bug prevention.
 *
 * @param  {...[middleware, ...cases]} middlewaresWithCases
 */
const combineMiddleware = (...middlewaresWithCases) => store => next => {
  const middlewares = combineCases(...middlewaresWithCases);
  return runCases(middlewares)(store)(next);
};

export default combineMiddleware;
