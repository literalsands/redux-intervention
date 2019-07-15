const _await = next => value =>
  value instanceof Promise ? value.then(next) : next(value);

/**
 * A promoter is a function that takes an action (and optionally the next function) and returns a thunk.
 *
 * @typedef {function} Promoter
 * @param {object} action
 * @param {[function]} next
 * @returns {function} thunk
 */

/**
 * A function that calls next, and passes an empty next function to the input promoter.
 *
 * @typedef {function} CallNext
 * @param {Promoter}
 * @returns {Promoter}
 */

/**
 * Doesn't call `next`.
 * @type CallNext
 */
export const dropNext = promoter => action => {
  return promoter(action, () => {});
};

/**
 * Calls `next(action)` before dispatching the promoter.
 * @type CallNext
 */
export const callNextBeforeDispatch = promoter => (action, next) => {
  return _await(() => promoter(action, () => {}))(next(action));
};

/**
 * Calls `next(action)` after dispatching the promoter.
 * Assumes the first param to the thunk function is dispatch.
 * @type CallNext
 */
export const callNextAfterDispatch = promoter => (action, next) =>
  _await(dispatchable => {
    // Just return a null dispatchable if there's no dispatchable to wrap.
    if (!(dispatchable instanceof Function || dispatchable instanceof Object)) {
      next(action);
      return null;
    }
    // Calling next after dispatching is a thunk by nature, so
    // we wrap dispatchable instead of wrapping the promoter.
    return (...thunkArgs) => {
      const [dispatch] = thunkArgs;
      if (!(dispatch instanceof Function)) {
        throw new Error(
          `\`callNextAfterDispatch\` promoter requires a thunk middleware on the store.`
        );
      }
      return _await(dispatched => {
        next(action);
        return dispatched;
      })(dispatch(dispatchable));
    };
  })(promoter(action, () => {}));

const hasThunk = dispatch => () => {
  try {
    return dispatch(dispatch => dispatch instanceof Function);
  } catch (e) {
    return false;
  }
};

const once = func => {
  let isSet;
  let value;
  return () => {
    if (!isSet) {
      isSet = true;
      value = func();
    }
    return value;
  };
};

export const createPromote = ({ wrapper }) =>
  /**
   * Promote
   *
   * Promotes a thunk into a middleware employing a function that calls the thunk with an action and optionally next.
   *
   * @param {Promoter} promoter - Takes and action and next and returns a thunk or an action. If the promoter doesn't return a function or an object, it will not be dispatched.
   *
   */
  _promoter => {
    if (!(_promoter instanceof Function)) {
      throw new Error(
        `\`promote\` requires a function as it's first parameter.`
      );
    }
    const promoter =
      wrapper && _promoter.length < 2 ? wrapper(_promoter) : _promoter;
    return ({ dispatch }) => next => {
      const _hasThunk = once(hasThunk(dispatch));
      return action => {
        _await(dispatchable => {
          if (dispatchable instanceof Function && !_hasThunk()) {
            throw new Error(
              `Dispatching a function from a \`promote\` middleware requires a \`thunk\` middleware on the store.`
            );
          }
          if (
            dispatchable instanceof Function ||
            dispatchable instanceof Object
          ) {
            return dispatch(dispatchable);
          }
          return null;
        })(promoter(action, next));
      };
    };
  };

const promote = createPromote({ wrapper: callNextBeforeDispatch });

export default promote;
