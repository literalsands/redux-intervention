import { lift } from "./chain";

const branch = _branch => ({ dispatch, getState }) => next => action =>
  _branch(next(action))(dispatch, getState);

export const branch;

export const branchFrom = lift(branch);
