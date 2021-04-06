import axios from 'axios';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { END } from 'redux-saga';

import AppLayout from '../components/AppLayout';
import PostCard from '../components/PostCard';
import PostForm from '../components/PostForm';
import { LOAD_POSTS_REQUEST } from '../reducers/post';
import { LOAD_MY_INFO_REQUEST } from '../reducers/user';
import wrapper from '../store/configureStore';

const Home = () => {
  const dispatch = useDispatch();
  const { me } = useSelector((state) => state.user);
  const { mainPosts, hasMorePosts, loadPostsLoading, retweetError } = useSelector((state) => state.post);

  useEffect(() => {
    if (retweetError) {
      alert(retweetError);
    }
  }, [retweetError]);

  useEffect(() => {
    function onScroll() {
      if (window.scrollY + document.documentElement.clientHeight > document.documentElement.scrollHeight - 300) {
        if (hasMorePosts && !loadPostsLoading) {
          const lastId = mainPosts[mainPosts.length - 1]?.id;
          dispatch({
            type: LOAD_POSTS_REQUEST,
            lastId
          });
        }
      }
    }
    window.addEventListener('scroll', onScroll);
    return () => {
      // 스크롤 해지를 해줘야함 메모리가 쌓임 , onScroll같은 함수를 넣어야함
      window.removeEventListener('scroll', onScroll);
    };
  }, [hasMorePosts, loadPostsLoading, mainPosts]);

  return (
    <AppLayout>
      {me && <PostForm />}
      {mainPosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </AppLayout>
  );
};

// ## getServerSideProps ##

// 서버사이드 렌더링을 하기 위해서
// Home보다 먼저 실행됨 (데이터먼저 불러오기)
// 이 부분이 실행되면 pages/index 에서  case HYDRATE: 이 실행됨
export const getServerSideProps = wrapper.getServerSideProps(async (context) => {
  console.log('getServerSideProps start');
  // 프론트서버에서실행 (주체는 프론트서버에서 백엔드로 쿠키전달 x 그래서 아래 )
  const cookie = context.req ? context.req.headers.cookie : ''; // 쿠키까지 전달
  // if문이랑 쿠키초기화를(아래) 안쓰면 다른사람이 사이트 들어와도 로그인되어있음 (프론트서버에서 쿠키가 공유되는 현상)
  axios.defaults.headers.Cookie = '';
  // 서버일때 && 쿠키가 있을때만 쿠키 넣어주기 아니면 위에 줄 초기화
  if (context.req && cookie) {
    axios.defaults.headers.Cookie = cookie;
  }
  context.store.dispatch({
    type: LOAD_MY_INFO_REQUEST
  });
  context.store.dispatch({
    type: LOAD_POSTS_REQUEST
  });

  context.store.dispatch(END); // 데이터를 success될때까지 기다려줌
  console.log('getServerSideProps end');
  await context.store.sagaTask.toPromise(); // 이건..사용방법 하라고
  // return { props: { data:123 }} // Home({ data })이렇게 전달가능
});

export default Home;
