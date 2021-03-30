const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const bcrypt = require('bcrypt');
const { User } = require('../models');

module.exports = () => {
  passport.use(
    new LocalStrategy(
      {
        // req.body email이다.
        usernameField: 'email',
        passwordField: 'password'
      },
      async (email, password, done) => {
        // await은 항상 try로 감싸줘야함
        try {
          const user = await User.findOne({
            where: { email }
          });
          if (!user) {
            // passport는 응답을 보내주지않고 done으로 결과 판단
            return done(null, false, { reason: '존재하지 않는 이메일입니다!' }); // 서버에러, 성공, 클라이언트에러(보내는측 문제)
          }

          const result = await bcrypt.compare(password, user.password); // compare : 비동기함수
          if (result) {
            return done(null, user);
          }

          return done(null, false, { reason: '비밀번호가 틀렸습니다.' });
          // 서버에러
        } catch (error) {
          console.error(error);
          return done(error);
        }
      }
    )
  );
};
