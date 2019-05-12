/**
 * Contract
 *
 * Enforce action shape through a middleware.
 *
 * @param {function} check
 * @param {object} options
 * @param {function} options.describe
 * @param {boolean} options.error
 * @param {boolean} options.warn
 */
const contract = (
  check = () => true,
  { describe = (action, state) => action, error = false, warn = true } = {}
) => ({ BROKEN } = {}) => ({ dispatch, getState }) => next => action => {
  const state = getState();
  try {
    if (check(action, state)) {
      next(action);
    } else {
      if (BROKEN !== undefined) {
        dispatch({ type: BROKEN, payload: action });
      }
      if (warn) {
        console.warn("Action contract broken.", describe(action, state));
      }
      if (error) {
        throw new TypeError("Action contract broken.", describe(action, state));
      }
    }
  } catch (e) {
    if (BROKEN !== undefined) {
      dispatch({ type: BROKEN, payload: action, meta: { error: e } });
    }
    if (warn) {
      console.error(e);
      console.warn("Action contract broken.", describe(action, state));
    }
    if (error) {
      throw e;
    }
  }
};

export default contract;
