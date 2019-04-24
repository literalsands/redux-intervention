import test from "ava";
import { createStore, applyMiddleware } from "redux";
import combine, { runCases, combineCases } from "./combine";

const appendPayload = n => store => next => action => {
  next({ ...action, payload: `${action.payload}${n}` });
};

const nullReducer = () => null;
const actionReducer = (state, action) => action;
const actionPayloadReducer = (state, action) => action.payload;

test("Returns a middleware.", t => {
  const store = createStore(nullReducer, applyMiddleware(combine()));
  t.notThrows(() => store.dispatch({ type: {} }));
});

test("Returns a combined cased middleware.", t => {
  const store = createStore(
    actionPayloadReducer,
    applyMiddleware(
      combine(
        [appendPayload("a-c"), "a", "b", "c"],
        [appendPayload("0-9"), ...new Array(10).fill(0).map((a, i) => `${i}`)]
      )
    )
  );
  t.notThrows(() => store.dispatch({ type: {} }));
  store.dispatch({ type: "boo", payload: "doo" });
  t.is(store.getState(), "doo");
  store.dispatch({ type: "a", payload: "1" });
  t.is(store.getState(), "1a-c");
  store.dispatch({ type: "0", payload: "2" });
  t.is(store.getState(), "20-9");
  store.dispatch({ type: "4", payload: "3" });
  t.is(store.getState(), "30-9");
});

test("Combines cases.", t => {
  const appendAC = appendPayload("a-c");
  const append03 = appendPayload("0-9");
  t.deepEqual(
    combineCases(
      [appendAC, "a", "b", "c"],
      [append03, ...new Array(4).fill(0).map((a, i) => `${i}`)]
    ),
    {
      a: appendAC,
      b: appendAC,
      c: appendAC,
      ["0"]: append03,
      ["1"]: append03,
      ["2"]: append03,
      ["3"]: append03
    }
  );
});
test("Combines across objects and arrays.", t => {
  const appendAC = appendPayload("a-c");
  const append03 = appendPayload("0-9");
  t.deepEqual(
    combineCases(
      [appendAC, "a", "b", "c"],
      [[append03, ...new Array(4).fill(0).map((a, i) => `${i}`)]],
      {
        ["d"]: append03
      }
    ),
    {
      a: appendAC,
      b: appendAC,
      c: appendAC,
      d: append03,
      ["0"]: append03,
      ["1"]: append03,
      ["2"]: append03,
      ["3"]: append03
    }
  );
});

test("Combine returns a function with keys that correspond to cases.", t => {
  const appendAC = appendPayload("a-c");
  const appendA = appendPayload("a");
  const middleware = combine([appendAC, "a", "b", "c"], [appendA, "d"]);
  t.is(typeof middleware, "function");
  t.is(middleware.a, appendAC);
  t.is(middleware.b, appendAC);
  t.is(middleware.c, appendAC);
  t.is(middleware.d, appendA);
});

test("Combines combinations.", t => {
  const appendAC = appendPayload("a-c");
  t.deepEqual(combineCases(combine([appendAC, "a", "b", "c"])), {
    a: appendAC,
    b: appendAC,
    c: appendAC
  });
});

test("Runs cases.", t => {
  const store = createStore(
    actionPayloadReducer,
    applyMiddleware(runCases({ b: appendPayload("a") }))
  );
  t.notThrows(() => store.dispatch({ type: {} }));
  store.dispatch({ type: "b", payload: "" });
  t.is(store.getState(), "a");
});
