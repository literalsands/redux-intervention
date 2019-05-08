export const defaultWrapper = promoter => (action, next) => {
  const thunk = promoter(
    action,
    /* Pass in an empty next callback. */ () => {}
  );
  return (...thunkArgs) => {
    const [dispatch] = thunkArgs;
    // Dispatch the thunk from here, or dispatch the action.
    // TODO: Optionally dispatch the thunk to be handled by the thunk middleware.
    const dispatchReturn =
      thunk instanceof Function
        ? thunk(...thunkArgs)
        : thunk instanceof Object
        ? dispatch(thunk)
        : thunk;
    if (dispatchReturn instanceof Promise) {
      return dispatchReturn.then(() => next(action));
    } else {
      return next(action);
    }
  };
};

/**
 * A promoter is a function that takes an action (and optionally the next function) and returns a thunk.
 *
 * @typedef {function} Promoter
 * @param {object} action
 * @param {[function]} next
 * @returns {function} thunk
 */

/**
 * Promote
 *
 * Promotes a thunk into a middleware employing a function that calls the thunk with an action and optionally next.
 *
 * @param {Promoter} promoter - Takes and action and next and returns a thunk.
 * @param {boolean|function} wrap - Boolean whether we want to use the default wrapping. *Defaults to false if the promoter takes a next parameter, and true if the promoter only takes an action parameter.* It can also take a function that takes a promoter and returns a new promoter that handles next. Resolves the thunk as a promise by default.
 *
 */
const promote = function(promoter, wrap) {
  if (!(promoter instanceof Function)) {
    throw new Error(`\`promote\` requires a function as it's first parameter.`);
  }
  const wrapper = wrap instanceof Function ? wrap : defaultWrapper;
  const wrappedPromoter =
    (wrap === undefined && promoter.length < 2) || wrap
      ? wrapper(promoter)
      : promoter;
  return ({ dispatch, getState }) => next => action => {
    const promotedThunk = wrappedPromoter(action, next);
    if (promotedThunk instanceof Function) {
      // TODO: Optionally dispatch the thunk to be handled by the thunk middleware.
      return promotedThunk(dispatch, getState);
    } else if (promotedThunk instanceof Object) {
      return dispatch(promotedThunk);
    } else {
      return next(action);
    }
  };
};

export default promote;
