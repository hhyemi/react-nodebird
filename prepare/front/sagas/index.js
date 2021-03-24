import { all, fork } from 'redux-saga/effects';

import postSaga from './post';
import userSaga from './user';

export default function* rootSage() {
  yield all([fork(postSaga), fork(userSaga)]);
}
