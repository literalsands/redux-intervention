/**
 * @type ShouldCaptureReducer
 * @param {*} state
 * @param {*} action
 * @return {boolean} shouldCapture
 *
 * Takes the redux state and an action and returns a boolean.
 */

/**
 * @type DispatchableReducer
 * @param {*} state
 * @param {object} action
 * @return {*} dispatchable
 *
 * Takes the redux state and an action and returns something dispatchable.
 *
 * A function is called as a thunk by default.
 */

/**
 * Capture is a generalized thunk middleware that lets you shallow, capture, and redispatch actions based on a shouldCaptureReducer.
 *
 * Capture actions based on a state reducer.
 * Optionally, dispatch new actions based on a state reducer that returns a thunk.
 *
 * @param {ShouldCaptureReducer} shouldCaptureReducer - A state reducer that returns a boolean.
 * @param {[DispatchableReducer]} dispatchableReducer - An optional state reducer that returns something dispatchable.
 */
const capture = (shouldCaptureReducer, dispatchableReducer) => {
  if (typeof shouldCaptureReducer !== "function") {
    console.error(
      "`capture` middleware requires a reducer as it's first argument."
    );
  }
  if (dispatchableReducer !== undefined && typeof dispatchableReducer !== "function") {
    console.error(
      "`capture` middleware takes a reducer as it's second argument."
    );
  }
  return ({ dispatch, getState }) => next => action => {
    const state = getState();
    const capture = shouldCaptureReducer(state, action);
    if (capture) {
      if (dispatchableReducer) {
        const dispatchable = dispatchableReducer(state, action);
        return dispatch(dispatchable);
      } else {
        return null;
      }
    }
    return next(action);
  };
};

export default capture;
