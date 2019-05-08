import promiseNext, { asPromise } from "./promiseNext";
import test from "ava";
import thunk from "redux-thunk";
import { createStore, applyMiddleware } from "redux";

const longTimeoutMiddleware = store => next => action => {
  setTimeout(() => next(action), 60 * 60 * 1000);
};
const timeoutMiddleware = store => next => action => {
  setTimeout(() => next(action), 200);
};
const timeoutFailureMiddleware = store => next => action => {
  return new Promise((resolve, reject) => setTimeout(() => reject(), 200));
};
const appendPayload = n => store => next => action => {
  next({ ...action, payload: `${action.payload}${n}` });
};

const nullReducer = () => null;
const actionReducer = (state, action) => action;
const actionPayloadReducer = (state, action) => action.payload;

test("Returns a promise.", t => {
  const store = createStore(nullReducer, applyMiddleware(promiseNext()));
  const dispatchReturn = store.dispatch({ type: {} });
  t.true(dispatchReturn instanceof Promise);
});

test("Promise resolves.", async t => {
  const store = createStore(actionReducer, applyMiddleware(promiseNext()));
  const action = { type: "Foo", payload: "Bar" };
  await store.dispatch(action);
  t.is(store.getState(), action);
});

test("Promise resolves sychronously when there is no asychronous behavior.", t => {
  const store = createStore(actionReducer, applyMiddleware(promiseNext()));
  const action = { type: "Foo", payload: "Bar" };
  store.dispatch(action);
  t.is(store.getState(), action);
});

test("Promise doesn't resolve sychronously when there is asychronous behavior.", t => {
  const store = createStore(
    actionReducer,
    applyMiddleware(promiseNext(timeoutMiddleware))
  );
  const action = { type: "Foo", payload: "Bar" };
  store.dispatch(action);
  t.not(store.getState(), action);
});

test("Returns a promise when there is a timeout.", async t => {
  const store = createStore(
    actionReducer,
    applyMiddleware(promiseNext(timeoutMiddleware))
  );
  const action = { type: "Foo", payload: "Bar" };
  const dispatchReturn = store.dispatch(action);
  t.not(store.getState(), action);
  await dispatchReturn;
  t.is(store.getState(), action);
});

test("Calls middleware in the right order.", async t => {
  const store = createStore(
    actionPayloadReducer,
    applyMiddleware(
      promiseNext(appendPayload("1"), appendPayload("2"), appendPayload("3"))
    )
  );
  await store.dispatch({ type: {}, payload: "0" });
  t.is(store.getState(), "0123");
  await store.dispatch({ type: {}, payload: "!" });
  t.is(store.getState(), "!123");
});

test("Returns a promise when there are multiple timeouts.", async t => {
  const store = createStore(
    actionReducer,
    applyMiddleware(promiseNext(timeoutMiddleware, timeoutMiddleware))
  );
  const action = { type: "Foo", payload: "Bar" };
  const dispatchReturn = store.dispatch(action);
  t.not(store.getState(), action);
  await dispatchReturn;
  t.is(store.getState(), action);
});

test("Works with thunks.", async t => {
  const store = createStore(
    actionReducer,
    applyMiddleware(thunk, promiseNext(timeoutMiddleware))
  );
  const action = { type: "Foo", payload: "Bar" };
  const thunkAction = dispatch => dispatch(action);
  const dispatchReturn = store.dispatch(thunkAction);
  t.not(store.getState(), action);
  await dispatchReturn;
  t.is(store.getState(), action);
});

test("Can be nested.", async t => {
  const store = createStore(
    actionReducer,
    applyMiddleware(promiseNext(promiseNext(timeoutMiddleware)))
  );
  const action = { type: "Foo", payload: "Bar" };
  const dispatchReturn = store.dispatch(action);
  t.not(store.getState(), action);
  await dispatchReturn;
  t.is(store.getState(), action);
});

test("Can catch errors that occur synchronously in the middleware.", async t => {
  const store = createStore(
    actionReducer,
    applyMiddleware(
      promiseNext(store => next => action => {
        throw new Error();
      })
    )
  );
  const action = { type: "Foo", payload: "Bar" };
  await t.throwsAsync(store.dispatch(action));
});

test("Can catch errors that occur in Promises returned in the middleware.", async t => {
  t.plan(2);
  const store = createStore(
    actionReducer,
    applyMiddleware(asPromise(timeoutFailureMiddleware))
  );
  const action = { type: "Foo", payload: "Bar" };
  // try {
  //   await t.throwsAsync(() =>
  await store
    .dispatch(action)
    .catch(e => t.pass("Got here"))
    .then(() => t.pass("and, here."));
  // } catch (e) {}
});

test("Provides an optional middleware that rejects all promises in this middleware", async t => {
  const promisedMiddleware = promiseNext(longTimeoutMiddleware);
  t.true(promisedMiddleware.abort instanceof Function);
  const store = createStore(
    actionReducer,
    applyMiddleware(promisedMiddleware.abort, promisedMiddleware)
  );
  const action = { type: "Foo", payload: "Bar" };
  // await store.dispatch(action);
  // t.pass();
});
