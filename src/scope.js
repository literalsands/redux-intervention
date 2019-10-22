/**
 * @function scope
 * @param {object} action
 * @param {*} state
 * @returns {*} Returns a new action from an old action.
 */

/**
 * Changes the action for the next middleware.
 *
 * @function createScopeMiddleware
 * @param {scope} scope
 * @returns {middleware}
 */
export const scope = _scope => {
  if (!(_scope instanceof Function)) {
    throw new Error("`scope` expects a function as it's first argument.")
  }
  return ({ getState }) => next => action => {
    const nextAction = _scope(action, getState());
    return next(
      nextAction instanceof Object && nextAction.type !== undefined
        ? nextAction
        : action
    );
  };
};
