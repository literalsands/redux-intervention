
# Redux Intervention
_A collection of functions for composing and simplifying middleware in Redux._

:construction: :construction: This is currently a work in progress. Pull requests and discussion are very welcome.

```bash
npm install redux-intervention
```

```js
import { promote } from 'redux-intervention';
promote(whatYouThunk);
```

## Overview

* *promote* - Promotes a thunk or action creator into a middleware.
* *combine* - Efficiently combine and limit middleware to action types.
* *promiseNext* - Wrap middleware(s) to return the value of `next(action)` as a promise.
* *request* - Wrap a middleware with additional actions that are dispatched on request, fulfillment, and failure.

### Promote

*Promblem:* Most of the logic of the application is best expressed as thunks and action creators. Middleware can be a great place to consolidate and expose that logic.

Promote a thunk to a middleware by writing a promoter (a function that takes an action, and optionally a next function) and passing it to promote.


### Combine

*Problem:* The suggested way to write middleware (with switch statements) can result in some hard to debug problems, like missed breaks applying actions to extra cases, and results in middleware functions that are inflexible.

Combine middleware based on action type cases. Order is preserved.


```js
const userMiddleware = combine(
  [login, "LOGIN"],
  [logout, "LOGOUT"]
)
const articlesMiddleware = combine(
  [getArticles, "REQUESTED_ARTICLES"],
  [getCategories, "REQUESTED_CATEGORIES"]
)
const middleware = combine(
  userMiddleware,
  articlesMiddleware
)
```

### Capture

*Problem:* Dropping dispatches of invalid actions or during invalid states is a common problem. This provides a very simple interface to handle capturing and re-dispatching or dropping actions.

For example, block actions that request a resource before that resource can be accessed.

```js
import check from 'check-types';

const logInvalidAction = capture((state, action) => {
  const invalidAction = (switch (action.type) {
    case "REQUESTED_USER_INFORMATION":
      return check.string(state.userToken);
      break;
    default:
      return false;
  })()
  console.warn('Invalid Action');
  return 
})
```


### PromiseNext

#### Problems:

- The only way to know if an action has resolved in the reducer is to subscribe to the state and know what the state should look like after it’s resolved.
- If you want your middleware to return a Promise, you must return the promise through all middleware.

Returns a promise that resolves when next(action) is called. So this will resolve when the action has resolved to either the last promiseNext middleware or the reducer.

In practice:

```js
// store.createStore(reducer, applyMiddleware(thunk, promiseNext()))

const loadSomeStuffMiddleware = store => next => action =>
// if (action.type === "REQUESTED_USER_THINGS")
  Promise.all(
    store.dispatch({ type: "REQUESTED_CATEGORIES", payload: { userId, token }}),
    store.dispatch({ type: "REQUESTED_ARTICLES", payload: { userId, token }}),
    store.dispatch({ type: "REQUESTED_FLOWERS", payload: { userId, token }})
  ).then(() => next(action))
```
    
    

_*Note:* Don’t wrap `thunk` in promiseNext(), since `thunk` doesn’t call `next(action)`._

### Request

*Problem:* redux-saga, etc. are all really bloated, and hard to make clean code from, and result in weird reducers that don’t always play well.

Wraps the middleware, dispatching additional REQUESTED, FULFILLED, FAILED actions when the middleware has resolved the action.

In action:

```js
const types = {
  REQUESTED: {},
  FULFILLED: {},
  FAILED: {}
};

const pendingActionMiddlewareReducer = (state = [], action) => {
  switch (action.type) {
    case types.REQUESTED:
      return [...state, action.payload];
    case types.FAILED:
    case types.FULFILLED:
      return state.filter(a => a !== action.payload)
    default:
      return state;
  }
}
const fulfilledActionMiddlewareReducer = (state = [], action) => {
  switch (action.type) {
    case types.FULFILLED:
      return [...state, action.payload];
    default:
      return state;
  }
}

const reducer = combineReducers({
  pending: pendingActionMiddlewareReducer,
  fulfilled: fulfilledActionMiddlewareReducer
})

const store = createStore(pendingActionMiddlewareReducer, applyMiddleware(request(middleware)))

store.dispatch({ type: "ASYNC" }).then(() => {
  store.getState()
  // success { pending: [], fulfilled: [{type: "ASYNC"}] }
  // failure { pending: [], fulfilled: [] }
})
store.getState() // { pending: [{type: "ASYNC"}], fulfilled: [] }
```