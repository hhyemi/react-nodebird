import React from 'react';
import Head from 'next/head';

import AppLayout from '../components/AppLayout';
import FollowList from '../components/FollowList';
import NicknameEditForm from '../components/NicknameEditForm';
import { useSelector } from 'react-redux';

const Profile = () => {
  const { me } = useSelector(state => state.user);
  return (
    <>
      <Head>
        <title>내프로필 | NodeBird</title>
      </Head>
      <AppLayout>
        <NicknameEditForm />
        <FollowList header="팔로잉" data={me.Followings} />
        <FollowList header="팔로워" data={me.Follwers} />
      </AppLayout>
    </>
  );
};

export default Profile;
