import test from "ava";
import { createStore, applyMiddleware } from "redux";
import { chain } from "./chain";

const payloadReducerReducer = reducer => (state, action) =>
  reducer(state, action instanceof Object ? action.payload : undefined);

const sumReducer = (state = "", action = "") => state + action;

const appendPayload = n => store => next => action => {
  next({ ...action, payload: `${action.payload}${n}` });
};

test("Chain returns a simple middleware when no middleware is provided.", t => {
  t.true(chain() instanceof Function);
  const value = {};
  t.is(chain()()(() => value)({}), value);
});

test("Chain returns the middleware if there is just one.", t => {
  const middleware = chain();
  t.is(middleware, chain(middleware));
});
