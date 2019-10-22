import test from "ava";
import { effect } from "./effect";
import { isMiddleware } from "./test-helpers";
import { createStore, applyMiddleware } from "redux";

test("Effect accepts a function.", t => {
  const inputs = [() => {}];
  inputs.forEach(input => {
    t.notThrows(() => {
      effect(input);
    });
  });
});

test("Effect throws an error when not given a function.", t => {
  const inputs = ["string", {}, [], 0, 1.0, false, true, null, undefined];
  inputs.forEach(input => {
    t.throws(() => {
      effect(input);
    });
  });
});

test("Effect returns a middleware.", t => {
  const middlewareTest = isMiddleware(t)(effect(() => {}));
  t.true(middlewareTest.callsNext());
  t.true(middlewareTest.callsGetState());
  t.false(middlewareTest.callsDispatch());
});

test("Effect Middleware calls the callback with the current action and state.", t => {
  t.plan(3);
  const state = {};
  const action = {};
  effect((_action, _state) => {
    t.is(action, _action);
    t.is(state, _state);
  })({ dispatch: () => {}, getState: () => state })(() => {
    t.pass();
  })(action);
});

test("Effect Middleware returns the value of the given callback.", t => {
  const value = {};
  t.is(
    effect(() => value)({ dispatch: () => {}, getState: () => ({}) })(() => {})(
      { type: {} }
    ),
    value
  );
});
