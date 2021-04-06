const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
const { Op } = require('sequelize');

const { User, Post, Image, Comment } = require('../models');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');

const router = express.Router();

// 로그인 유지
router.get('/', async (req, res, next) => {
  console.log(req.headers);
  try {
    if (req.user) {
      // 로그인이 되어있으면
      const fullUserWithoutPassword = await User.findOne({
        where: { id: req.user.id },
        attributes: {
          // 비번제외해서 가져오겠다
          exclude: ['password']
        },
        // modelse의 associate에 있던애들, as썼으면 as써야함
        include: [
          {
            model: Post,
            attributes: ['id'] // 데이터 개수만 가져오기 위한 (내용은 필요없음 )
          },
          {
            model: User,
            as: 'Followings',
            attributes: ['id']
          },
          {
            model: User,
            as: 'Followers',
            attributes: ['id']
          }
        ]
      });
      res.status(200).json(fullUserWithoutPassword);
    } else {
      res.status(200).json(null);
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// GET /user/followers
router.get('/followers', isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.user.id } });
    if (!user) {
      res.status(403).send('팔로워한 사람이 없습니다.');
    }
    const followers = await user.getFollowers({
      limit: parseInt(req.query.limit)
    });
    res.status(200).json(followers);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// GET /user/followings
router.get('/followings', isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.user.id } });
    if (!user) {
      res.status(403).send('팔로잉한 사람이 없습니다.');
    }
    const followings = await user.getFollowings({
      limit: parseInt(req.query.limit)
    });
    res.status(200).json(followings);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// GET /user/3
router.get('/:userId', async (req, res, next) => {
  try {
    const fullUserWithoutPassword = await User.findOne({
      where: { id: req.params.userId },
      attributes: {
        exclude: ['password']
      },
      include: [
        {
          model: Post,
          attributes: ['id']
        },
        {
          model: User,
          as: 'Followings',
          attributes: ['id']
        },
        {
          model: User,
          as: 'Followers',
          attributes: ['id']
        }
      ]
    });
    if (fullUserWithoutPassword) {
      // 남의 정보니까 길이만 보내주기 (정보 X 개인정보침해 예방)
      const data = fullUserWithoutPassword.toJSON(); // JSON으로 변경
      data.Posts = data.Posts.length;
      data.Followings = data.Followings.length;
      data.Followers = data.Followers.length;
      res.status(200).json(data);
    } else {
      res.status(404).json('존재하지 않는 사용자입니다.');
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.get('/:userId/posts', async (req, res, next) => {
  // GET /user/1/posts
  try {
    const user = await User.findOne({ where: { id: req.params.userId } });
    if (user) {
      const where = {};
      if (parseInt(req.query.lastId, 10)) {
        // 초기 로딩이 아닐 때
        where.id = { [Op.lt]: parseInt(req.query.lastId, 10) };
      } // 21 20 19 18 17 16 15 14 13 12 11 10 9 8 7 6 5 4 3 2 1
      const posts = await user.getPosts({
        where,
        limit: 10,
        include: [
          {
            model: Image
          },
          {
            model: Comment,
            include: [
              {
                model: User,
                attributes: ['id', 'nickname']
              }
            ]
          },
          {
            model: User,
            attributes: ['id', 'nickname']
          },
          {
            model: User,
            through: 'Like',
            as: 'Likers',
            attributes: ['id']
          },
          {
            model: Post,
            as: 'Retweet',
            include: [
              {
                model: User,
                attributes: ['id', 'nickname']
              },
              {
                model: Image
              }
            ]
          }
        ]
      });
      console.log(posts);
      res.status(200).json(posts);
    } else {
      res.status(404).send('존재하지 않는 사용자입니다.');
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
});

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
            model: Post,
            attributes: ['id']
          },
          {
            model: User,
            as: 'Followings',
            attributes: ['id']
          },
          {
            model: User,
            as: 'Followers',
            attributes: ['id']
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

router.post('/logout', isLoggedIn, async (req, res, next) => {
  req.logout();
  req.session.destroy();
  res.send('ok');
});

router.patch('/nickname', isLoggedIn, async (req, res, next) => {
  try {
    await User.update(
      {
        nickname: req.body.nickname
      },
      { where: { id: req.user.id } }
    );
    res.status(200).json({ nickname: req.body.nickname });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// PATCH /user/1/follow
router.patch('/:userId/follow', isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.params.userId } });
    if (!user) {
      res.status(403).send('팔로우할 대상이 없습니다.');
    }
    await user.addFollowers(req.user.id);
    res.status(200).json({ UserId: parseInt(req.params.userId) });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// DELETE /user/1/follow
router.delete('/:userId/follow', isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.params.userId } });
    if (!user) {
      res.status(403).send('팔로잉 제거할 대상이 없습니다.');
    }
    await user.removeFollowers(req.user.id);
    res.status(200).json({ UserId: parseInt(req.params.userId) });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// DELETE /user/follower/2
router.delete('/follower/:userId', isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.params.userId } });
    if (!user) {
      res.status(403).send('팔로워 제거할 대상이 없습니다.');
    }
    await user.removeFollowings(req.user.id);
    res.status(200).json({ UserId: parseInt(req.params.userId, 10) });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
