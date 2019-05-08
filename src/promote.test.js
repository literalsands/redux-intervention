import promote from "./promote";
import combine from "./combine";
import test from "ava";
import thunk from "redux-thunk";
import { createStore, applyMiddleware } from "redux";

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
  dispatch({ type: types.SET, payload: getState() / 2 });
};

test("Dispatching a thunk.", t => {
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
    applyMiddleware(combine([promote(() => halveStateThunk), types.HALVE]))
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
    dispatch: () => {
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

test("Throws an error when called without a function.", t => {
  t.throws(promote);
})

test("Creates a middleware from a thunk promoter.", t => {
  const halfStateMiddleware = promote(() => halveStateThunk);

  // Looks like a middleware.
  t.true(halfStateMiddleware({}) instanceof Function);
  t.true(halfStateMiddleware({})(() => {}) instanceof Function);
  t.notThrows(() => halfStateMiddleware({ dispatch: () => {}, getState: () => 10 })(() => {})({}));

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

  halfStateMiddleware(store)(next)({});
  t.true(calledDispatch);
  t.true(calledNext);
});

test("Creates a null middleware from null.", t => {
  const nullMiddleware = promote(() => null);

  // Looks like a middleware.
  t.true(nullMiddleware({}) instanceof Function);
  t.true(nullMiddleware({})(() => {}) instanceof Function);
  t.notThrows(() => nullMiddleware({ dispatch: () => {} })(() => {})({}));

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

  nullMiddleware(store)(next)({});
  // We don't call dispatch.
  t.false(calledDispatch);
  // But, we do call the next middleware.
  t.true(calledNext);
});

test("Accepts custom wrappers.", t => {
  t.pass();
});
