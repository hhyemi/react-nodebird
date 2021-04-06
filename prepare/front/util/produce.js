import { enableES5, produce } from 'immer';

export default (...args) => {
  enableES5();
  return produce(...args);
};

// 익스에서도 되게 확장
// import produce from 'immer';
// 위에 import를 아래로 변경
// import produce from '../util/produce';
