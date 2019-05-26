import test from "ava";
import { createStore, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import capture from "./capture";

test("Returns a middleware.", t => {
  // Never capture the action.
  const middleware = capture(() => false);
  // Looks like a middleware.
  t.true(middleware({}) instanceof Function);
  t.true(middleware({})(() => {}) instanceof Function);
  t.notThrows(() =>
    middleware({ dispatch: () => {}, getState: () => {} })(() => {})({})
  );

  // Behaves like a middleware.
  let calledNext = false,
    calledDispatch = false;
  const store = {
    dispatch: () => {
      calledDispatch = true;
    },
    getState: () => {}
  };
  const next = () => {
    calledNext = true;
  };

  middleware(store)(next)({});
  t.false(calledDispatch); // We don't expect it to call dispatch in the null case.
  t.true(calledNext);

  // Store likes it.
  t.notThrows(() =>
    createStore(() => null, applyMiddleware(middleware)).dispatch({ type: {} })
  );
});

test("Requires a shouldCaptureReducer function.", t => {
  // Looks like a middleware.
  t.throws(() =>
    capture()({ dispatch: () => {}, getState: () => {} })(() => {})({})
  );
  // Looks like a middleware.
  t.throws(() =>
    capture("a")({ dispatch: () => {}, getState: () => {} })(() => {})({})
  );
  // Looks like a middleware.
  t.throws(() =>
    capture(12)({ dispatch: () => {}, getState: () => {} })(() => {})({})
  );
  // Looks like a middleware.
  t.throws(() =>
    capture(null)({ dispatch: () => {}, getState: () => {} })(() => {})({})
  );
  t.notThrows(() =>
    capture(() => false)({ dispatch: () => {}, getState: () => {} })(() => {})(
      {}
    )
  );
});

test("Captures an action.", t => {
  let redispatched;
  const middleware = capture(
    () => true,
    () => {
      redispatched = true;
      return { type: "" };
    }
  );
  middleware({ dispatch: () => {}, getState: () => {} })(() => {})({});
  t.true(redispatched);
});

test("Our dispatch can count up.", t => {
  const store = createStore(
    (state, action) => action.payload,
    0,
    applyMiddleware(
      capture(
        (state, action) =>
          Number.isFinite(action.payload) ? action.payload < 6 : false,
        (state, action) => ({ type: "", payload: action.payload + 1 })
      )
    )
  );

  store.dispatch({ payload: -5 });
  t.is(store.getState(), 6);
});

test("Count up after thunking.", t => {
  const store = createStore(
    (state, action) => action.payload,
    0,
    applyMiddleware(
      thunk,
      capture(
        (state, action) =>
          Number.isFinite(action.payload) ? action.payload < 6 : false,
        (state, action) => ({ type: "", payload: action.payload + 1 })
      )
    )
  );

  store.dispatch(dispatch => dispatch({ type: "", payload: -5 }));
  t.is(store.getState(), 6);
});
