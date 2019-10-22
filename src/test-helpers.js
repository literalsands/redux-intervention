import { createStore, applyMiddleware } from "redux";
import { resolve } from "./helpers";

export const isMiddleware = t => (
  middleware,
  action = { type: {}},
  state = null
) => {
  let callsDispatch, callsGetState, callsNext, contextReturn;
  const store = createStore(() => null, state, applyMiddleware(middleware));
  t.notThrows(() => store.dispatch(action));
  t.notThrows(() => {
    const dispatch = () => {
      callsDispatch = true;
    };
    const getState = () => {
      callsGetState = true;
      return state;
    };
    const store = { dispatch, getState };
    const context = middleware(store);
    t.is(typeof context, "function");

    const next = () => {
      callsNext = true;
    };
    const contextWithNext = context(next);
    t.is(typeof contextWithNext, "function");

    contextReturn = contextWithNext(action);
  });
  return {
    callsDispatch() {
      return !!callsDispatch;
    },
    callsNext() {
      return !!callsNext;
    },
    callsGetState() {
      return !!callsGetState;
    },
    contextReturn() {
      return contextReturn;
    }
  };
};
