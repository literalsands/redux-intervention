import { policy } from "./policy";
import { chain } from "./chain";
import test from "ava";
import { isMiddleware } from "./test-helpers";

test("Policy creates a middleware wrapper.", t => {
  t.pass();
});

test("Policy 'pass' is correctly enforced.", t => {
  // Pass
  const middleware = policy((context, next) => context(next)())(chain());
  const middlewareTest = isMiddleware(t)(middleware);
  t.true(middlewareTest.callsNext());
  t.false(middlewareTest.callsDispatch());
  t.false(middlewareTest.callsGetState());
});

// First
policy((context, next) => () => {
  _await(next, context(() => {}));
});

// Last
policy((context, next) => action => {
  _await(() => context(() => {})(action), () => next(action));
});
