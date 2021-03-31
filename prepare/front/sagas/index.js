import { all, fork } from 'redux-saga/effects';
import axios from 'axios';

import postSaga from './post';
import userSaga from './user';

axios.defaults.baseURL = 'http://localhost:3065'; // axios보낼때 앞에 붙여줌
axios.defaults.withCredentials = true; // 쿠키전달을 위한 cors문제

export default function* rootSage() {
  yield all([fork(postSaga), fork(userSaga)]);
}
