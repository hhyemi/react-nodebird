const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');

const { User, Post } = require('../models');
const { isLoggedIn, isNotLoggedIn } = require('./middleware');

const router = express.Router();

// POST /user/login
// done이 전달되는 곳 -> (err,user,info)
router.post('/login', isNotLoggedIn, (req, res, next) => {
  // passport는(req, res, next) 를 쓸 수 없음 미들웨어 확장
  // passport.authenticate해서  passport/local로감
  passport.authenticate('local', (err, user, info) => {
    // passport/local 에서 done(callback)되면 실행
    if (err) {
      console.error(err);
      return next(err);
    }
    if (info) {
      return res.status(401).send(info.reason); // 401 : 허가되지 않음
    }
    return req.login(user, async (loginErr) => {
      // req.login: passport에서 지원하는 login
      // res.setHeader('Cookie','cxlhy'); , 쿠키를 보내주고 세션이랑 연결해줌
      if (loginErr) {
        // 혹시 몰라 체크
        console.error(loginErr);
        return next(loginErr);
      }
      const fullUserWithoutPassword = await User.findOne({
        where: { id: user.id },
        attributes: {
          // 비번제외해서 가져오겠다
          exclude: ['password']
        },
        // modelse의 associate에 있던애들, as썼으면 as써야함
        include: [
          {
            model: Post
          },
          {
            model: User,
            as: 'Followings'
          },
          {
            model: User,
            as: 'Followers'
          }
        ]
      });
      return res.status(200).json(fullUserWithoutPassword); // action.data로 감 , passport/index serializeUser실행
    });
  })(req, res, next);
});

router.post('/', async (req, res, next) => {
  // POST /user
  try {
    const exUser = await User.findOne({
      where: {
        email: req.body.email
      }
    });

    if (exUser) {
      return res.status(403).send('이미 사용중인 아이디입니다.'); // 응답은 한번만
    }

    // await : 순서 맞춰주기 위한 안쓰면 비동기가 돼서 res.json(); 이 실행되기전에 실행됨
    const hashedPassword = await bcrypt.hash(req.body.password, 10); // 비밀번호 암호화 (해시화) , 숫자 클수록 보안강화
    await User.create({
      email: req.body.email,
      nickname: req.body.nickname,
      password: hashedPassword
    });
    res.status(201).send('ok');
    // res.send('ok'); 200 생략가능 근데 써주는게 좋음
  } catch (error) {
    console.error(error);
    next(error); // status 500
  }
});

router.post('/logout', isNotLoggedIn, async (req, res, next) => {
  req.logout();
  req.session.destroy();
  res.send('ok');
});

module.exports = router;
