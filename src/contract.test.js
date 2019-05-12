import test from "ava";
import { createStore, applyMiddleware } from "redux";
import contract from "./contract";

test("Returns a middleware.", t => {
  const middleware = contract()();
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
  t.false(calledDispatch);
  t.true(calledNext);

  // Store likes it.
  t.notThrows(() =>
    createStore(() => null, applyMiddleware(middleware)).dispatch({ type: {} })
  );
});
