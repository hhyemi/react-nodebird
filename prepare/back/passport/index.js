// passport 설정파일
const passport = require('passport');
const local = require('./local');
const { User } = require('../models');

module.exports = () => {
  passport.serializeUser((user, done) => {
    // 서버쪽에 [{ id: 1, cookie: 'clhxy' }] 세션 저장
    done(null, user.id);
  });

  // 위에 user.id 가 아래 id로 전달
  // 로그인성공하고 그 다음 요청부터 매번 실행해서 사용자정보를 복구해냄
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findOne({ where: { id } });
      done(null, user); // req.User에 넣어줌
    } catch (error) {
      console.error(error);
      done(error);
    }
  });

  local();
};

// 프론트에서 서버로는 cookie만 보내요(clhxy)
// 서버가 쿠키파서, 익스프레스 세션으로 쿠키 검사 후 id: 1 발견
// id: 1이 deserializeUser에 들어감
// req.user로 사용자 정보가 들어감

// 요청 보낼때마다 deserializeUser가 실행됨(db 요청 1번씩 실행)
// 실무에서는 deserializeUser 결과물 캐싱
