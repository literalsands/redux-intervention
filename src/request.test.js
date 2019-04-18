import request from "./request";
import test from "ava";
import { createStore, applyMiddleware } from "redux";

const types = {
  FAILED: "REQUEST_FAILED",
  FULFILLED: "REQUEST_FULFILLED",
  REQUESTED: "REQUESTED"
};

const timeoutMiddleware = store => next => action => {
  setTimeout(() => next(action), 200);
};
const timeoutFailureMiddleware = store => next => action =>
  new Promise((resolve, reject) =>
    setTimeout(() => {
      reject();
    }, 200)
  );

const requestTimeoutMiddleware = request(timeoutMiddleware)(types);
const requestTimeoutFailureMiddleware = request(timeoutFailureMiddleware)(
  types
);

const requestActions = action =>
  Object.values(types)
    .map(type => ({ type, payload: action }))
    .reduce((actions, action) => ({ ...actions, [action.type]: action }), {});

// NOTE: We're going to get an initial init action from Redux.
const actionArrayReducer = (state = [], action) => [...state, action];

test("Dispatch resolves.", async t => {
  const store = createStore(
    actionArrayReducer,
    applyMiddleware(requestTimeoutMiddleware)
  );
  const action = { type: "Hello", payload: "Bar" };
  await store.dispatch(action);
  t.deepEqual(store.getState()[2], action);
});

test("Fulfillment dispatches resolve.", async t => {
  const store = createStore(
    actionArrayReducer,
    applyMiddleware(requestTimeoutMiddleware)
  );
  const action = { type: "Hello", payload: "Bar" };
  const actions = requestActions(action);
  await store.dispatch(action);
  t.deepEqual(store.getState()[1], actions[types.REQUESTED]);
  t.deepEqual(store.getState()[2], action);
  t.deepEqual(store.getState()[3], actions[types.FULFILLED]);
  t.log(store.getState());
});

test("Fulfillment dispatches resolve on failure.", async t => {
  const store = createStore(
    actionArrayReducer,
    applyMiddleware(requestTimeoutFailureMiddleware)
  );
  const action = { type: "Hello", payload: "Bar" };
  const actions = requestActions(action);
  await store.dispatch(action);
  t.deepEqual(store.getState()[1], actions[types.REQUESTED]);
  t.deepEqual(store.getState()[2], {
    ...actions[types.FAILED],
    meta: { error: undefined },
    error: true
  });
});
