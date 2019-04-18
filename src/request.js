import asPromise from "withPromise";

export default middleware => ({ FAILED, FULFILLED, REQUESTED }) => store => {
  const types = [FAILED, FULFILLED, REQUESTED].filter(p => p);
  const fulfillWithStore = asPromise(middleware)(store);
  return next => {
    const fulfill = fulfillWithStore(next);
    return action => {
      // NOTE: Ignore things that we've dispatched.
      if (types.includes(action.type)) {
        return next(action);
      }
      if (REQUESTED !== undefined) {
        store.dispatch({
          type: REQUESTED,
          payload: action
        });
      }
      return fulfill(action)
        .then(resolved => {
          if (FULFILLED !== undefined) {
            store.dispatch({
              type: FULFILLED,
              payload: action
            });
          }
          return resolved;
        })
        .catch(error => {
          // TODO: Optionally continue the dispatch failure, here.
          if (FAILED !== undefined) {
            store.dispatch({
              type: FAILED,
              payload: action,
              error: true,
              meta: {
                error
              }
            });
          }
        });
    };
  };
};
