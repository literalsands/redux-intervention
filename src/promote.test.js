import promote from "./promote";
import {
  createPromoter,
  dropNext,
  callNextAfterDispatch,
  callNextBeforeDispatch
} from "./promote";
import combine from "./combine";
import test from "ava";
import thunk from "redux-thunk";
import { createStore, applyMiddleware } from "redux";

/**
 * Inputs and Environment
 */

test("Requires a promoter.", t => {
  t.throws(promote);
});

const promoterCalls = promoterWrapper => action => {
  let callOrder = [];
  const originalPromoter = (action, next) => {
    callOrder.push("promoter");
    return action;
  };

  const wrappedPromoter = promoterWrapper(originalPromoter);

  let dispatchable = wrappedPromoter(action, () => {
    callOrder.push("next");
  });

  return {
    dispatchable:
      dispatchable instanceof Function
        ? dispatch =>
            dispatchable(action => {
              callOrder.push("thunk");
              return dispatch(action);
            })
        : dispatchable,
    callOrder
  };
};

test("`dropNext` doesn't call next.", async t => {
  const action = {};
  const { dispatchable, callOrder } = promoterCalls(dropNext)(action);
  t.is(await dispatchable, action);
  t.deepEqual(callOrder, ["promoter"]);
});

test("`callNextBeforeDispatch` calls next and then returns the promoter.", async t => {
  const action = {};
  const { dispatchable, callOrder } = promoterCalls(callNextBeforeDispatch)(
    action
  );
  t.is(await dispatchable, action);
  t.deepEqual(callOrder, ["next", "promoter"]);
});

test("`callNextAfterDispatch` calls the promoter then next in a thunk wrapper.", async t => {
  const action = {};
  const { dispatchable, callOrder } = promoterCalls(callNextAfterDispatch)(
    action
  );
  // `callNextAfterDispatch` wraps the dispatchable in a thunk.
  t.is(typeof (await dispatchable), "function");
  t.deepEqual(callOrder, ["promoter"]);
  // The thunk wrapper and next are called when the thunk is executed.
  t.is(await (await dispatchable)(a => a), action);
  t.deepEqual(callOrder, ["promoter", "thunk", "next"]);
});

test.skip("`callNextAfterDispatch` calls the promoter only once per action.", t => {
  t.fail();
});
test.skip("`callNextAfterDispatch` calls next only once per action.", t => {
  t.fail();
});
test.skip("Promote throws an error when simple dispatch loops would occur.", t => {
  t.fail();
});
test.skip("Promote middleware returns synchronously when the computation is synchronous.", t => {
  t.fail();
});
test.skip("Promote middleware returns a Promise when the computation is asynchronous.", t => {
  t.fail();
});

test("Requires dispatch to handle functions as thunks.", t => {
  // Promoter returns a function.
  const middleware = promote(a => d => d(a));
  const dispatchThunk = action => {
    if (action instanceof Function) {
      return action(dispatchThunk);
    }
  };
  t.throws(() => middleware({ dispatch: () => {} })(() => {})({}));
  t.notThrows(() => middleware({ dispatch: dispatchThunk })(() => {})({}));
});

// Promote creates a middleware.
// Promote creates a middleware when provided with a promoter.
// The default promoter wrapper is used when the function used only has a next value.
// The default promoter wrapper calls next.
// The default promoter wrapper calls next before calling the promoter.
// The default promoter wrapper can be set when creating a new promote function.
// The promoter wrappers call the

// promote(() => ({ type: types.SET, payload: 0 }));
// promote(() => dispatch => dispatch({ type: types.SET, payload: 0 }));
// promote(action => ({ type: types.SET, payload: action.payload }));
// promote(action => dispatch =>
//   dispatch({ type: types.SET, payload: action.payload })
// );

/**
 * Various tests using an example store.
 */
const types = {
  SET: "SET_NUMBER",
  HALVE: "HALVE_NUMBER",
  INCREMENT: "INCREMENT_NUMBER",
  DECREMENT: "DECREMENT_NUMBER"
};

const numberReducer = ({ SET, INCREMENT, DECREMENT }) => (
  state = 0,
  action
) => {
  switch (action.type) {
    case SET:
      return action.payload;
    case INCREMENT:
      return state + 1;
    case DECREMENT:
      return state - 1;
    default:
      return state;
  }
};

const timeoutThunker = (action, next) => (dispatch, getState) =>
  setTimeout(() => {
    dispatch(action);
    next(action);
  }, 100);

const halveStateThunk = (dispatch, getState) => {
  return dispatch({ type: types.SET, payload: getState() / 2 });
};

test("Thunks work as expected in the test environment.", t => {
  const store = createStore(numberReducer(types), applyMiddleware(thunk));
  store.dispatch({ type: types.SET, payload: 10 });
  t.is(store.getState(), 10);
  store.dispatch(halveStateThunk);
  t.is(store.getState(), 5);
});

test("Dispatching an action to promoted thunk.", t => {
  const store = createStore(
    numberReducer(types),
    applyMiddleware(
      thunk,
      promote((action = {}) =>
        action.type === types.HALVE ? halveStateThunk : null
      )
    )
  );
  store.dispatch({ type: types.SET, payload: 10 });
  t.is(store.getState(), 10);
  store.dispatch({ type: types.HALVE });
  t.is(store.getState(), 5);
});

test("Works with combine.", t => {
  const store = createStore(
    numberReducer(types),
    applyMiddleware(
      thunk,
      combine([promote(() => halveStateThunk), types.HALVE])
    )
  );
  store.dispatch({ type: types.SET, payload: 10 });
  t.is(store.getState(), 10);
  store.dispatch({ type: types.HALVE });
  t.is(store.getState(), 5);
});

test("Creates a middleware from an action creator promoter.", t => {
  const halfStateMiddleware = promote(() => ({ type: types.HALVE }));

  // Looks like a middleware.
  t.true(halfStateMiddleware({}) instanceof Function);
  t.true(halfStateMiddleware({})(() => {}) instanceof Function);
  t.notThrows(() => halfStateMiddleware({ dispatch: () => {} })(() => {})({}));

  // Behaves like a middleware.
  let calledNext = false,
    calledDispatch = false;
  const store = {
    dispatch: action => {
      calledDispatch = true;
    },
    getState: () => {}
  };
  const next = () => {
    calledNext = true;
  };

  halfStateMiddleware(store)(next)({});
  t.true(calledDispatch);
  t.true(calledNext);
});

test("Creates a middleware from a thunk promoter.", t => {
  const halfStateMiddleware = promote(() => halveStateThunk);

  // Looks like a middleware.
  t.true(halfStateMiddleware({}) instanceof Function);
  t.true(halfStateMiddleware({})(() => {}) instanceof Function);

  // Behaves like a middleware.
  let calledNext = false,
    calledDispatch = false;
  const store = {
    dispatch: action => {
      calledDispatch = true;
      // Requires a thunk middleware since we're promoting a thunk.
      if (action instanceof Function) {
        return action(store.dispatch, store.getState);
      }
    },
    getState: () => {}
  };
  const next = () => {
    calledNext = true;
  };

  halfStateMiddleware(store)(next)({});
  t.true(calledDispatch);
  t.true(calledNext);
});

test("Creates a null middleware from null.", t => {
  const nullMiddleware = promote(() => null);

  // Looks like a middleware.
  t.true(nullMiddleware({}) instanceof Function);
  t.true(nullMiddleware({})(() => {}) instanceof Function);

  // Behaves like a middleware.
  let calledNext = false,
    calledDispatch = false;
  const store = {
    dispatch: action => {
      calledDispatch = true;
    },
    getState: () => {}
  };
  const next = () => {
    calledNext = true;
  };

  t.notThrows(() => nullMiddleware(store)(next)(null));
  // We don't call dispatch.
  t.false(calledDispatch);
  // But, we do call the next middleware.
  t.true(calledNext);
});
