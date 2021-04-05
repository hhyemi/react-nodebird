import { HYDRATE } from 'next-redux-wrapper';
import { combineReducers } from 'redux';

import user from './user';
import post from './post';

// // (이전상태, 액션) => 다음상태
// const rootReducer = combineReducers({
//   // HYDRATE 를 넣기위해서 index Reducer 추가
//   index: (state = {}, action) => {
//     switch (action.type) {
//       case HYDRATE:
//         console.log('HYDRATE', action);
//         return { ...state, ...action.payload };
//       default:
//         return state;
//     }
//   },
//   user,
//   post
// });

// HYDRATE가 덮어쓰기위해서 구조 변경 (index Reducer 제거)
const rootReducer = (state, action) => {
  switch (action.type) {
    case HYDRATE:
      console.log('HYDRATE', action);
      return action.payload;
    default: {
      const combineReducer = combineReducers({
        user,
        post
      });
      return combineReducer(state, action);
    }
  }
};

export default rootReducer;
