/**
 * @function effect
 * @param {object} action
 * @param {*} state
 * @returns {*} Returns something that could be dispatched.
 */

/**
 * @function createEffectMiddleware
 * @param {effect} effect
 * @returns {middleware}
 */
export const effect = _effect => {
  if (!(_effect instanceof Function)) {
    throw new Error("`effect` expects a function as it's first argument.");
  }
  return ({ getState }) => next => action => {
    next(action);
    return _effect(action, getState());
  };
};
