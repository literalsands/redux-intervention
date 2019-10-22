import test from "ava";
import { scope } from "./scope";
import { isMiddleware } from "./test-helpers";
import { createStore, applyMiddleware } from "redux";

test("Scope accepts a function.", t => {
  const inputs = [() => {}];
  inputs.forEach(input => {
    t.notThrows(() => {
      scope(input);
    });
  });
});

test("Scope throws an error when not given a function.", t => {
  const inputs = ["string", {}, [], 0, 1.0, false, true, null, undefined];
  inputs.forEach(input => {
    t.throws(() => {
      scope(input);
    });
  });
});

test("Scope returns a middleware.", t => {
  const middlewareTest = isMiddleware(t)(scope(() => {}));
  t.true(middlewareTest.callsNext());
  t.true(middlewareTest.callsGetState());
  t.false(middlewareTest.callsDispatch());
});

test("Scope Middleware calls the callback with the current action and state.", t => {
  t.plan(3);
  const state = {};
  const action = {};
  scope((_action, _state) => {
    t.is(action, _action);
    t.is(state, _state);
  })({ dispatch: () => {}, getState: () => state })(() => {
    t.pass();
  })(action);
});

test("Scope Middleware calls next with the current action when the callback returns something other than an object with a type.", t => {
  const actions = [
    "string",
    {},
    [],
    0,
    1.0,
    false,
    true,
    null,
    undefined,
    { type: undefined }
  ];
  t.plan(3 * actions.length);
  const state = {};
  const action = {};
  actions.forEach($action => {
    scope((_action, _state) => {
      t.is(action, _action);
      t.is(state, _state);
      return $action;
    })({ dispatch: () => {}, getState: () => state })(_action => {
      t.is(action, _action);
    })(action);
  });
});

test("Scope Middleware calls next with the returned action when the callback returns an object with a type.", t => {
  const actions = ["string", {}, [], 0, 1.0, false, true, null].map(type => ({
    type
  }));
  t.plan(3 * actions.length);
  const state = {};
  const action = {};
  actions.forEach($action => {
    scope((_action, _state) => {
      t.is(action, _action);
      t.is(state, _state);
      return $action;
    })({ dispatch: () => {}, getState: () => state })(_action => {
      t.is(_action, $action);
    })(action);
  });
});

test("Scope Middleware returns the value of next.", t => {
  const next = {};
  t.is(
    scope(() => null)({ dispatch: () => {}, getState: () => ({}) })(() => {
      return next;
    })({ type: {} }),
    next
  );
});
