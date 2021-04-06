const express = require('express');
const cors = require('cors');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');
const hpp = require('hpp');
const helmet = require('helmet');

const postRouter = require('./routes/post');
const postsRouter = require('./routes/posts');
const userRouter = require('./routes/user');
const hashtagRouter = require('./routes/hashtag');
const db = require('./models');
const passportConfig = require('./passport');

dotenv.config();

const app = express(); // express 서버
db.sequelize
  .sync()
  .then(() => {
    console.log('db연결 성공!');
  })
  .catch(console.error);

passportConfig();

if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
  app.use(hpp());
  app.use(helmet());
} else {
  app.use(morgan('dev')); // 프론트 요청을 터미널에 보여줌
}

// cors문제 미들웨어로 처리하기 (브라우저에서 다른 포트로 요청했을때 문제를 해결)
// Access-Control-Allow-Origin 이 Headers에 추가됨
app.use(
  cors({
    origin: ['http://localhost:3060', 'nodebird.com', 'http://54.180.131.28'], // credentials썼을때는 * 하지말기 (origin : true 가능)
    credentials: true // cors문제 쿠키까지 전달하기 위해서
  })
);
// '/' : 'localhost:3060
// express static미들웨어 __dirname 현재폴더 (back) 와 upload를 합쳐줌 / path.join: 운영체제에 맞게 알아서 조인
app.use('/', express.static(path.join(__dirname, 'uploads')));
// data를 해석하여 req.body로 받기 위한 설정, 위치는 위에 있어야 함 (위치중요!)
app.use(express.json()); // front에서 보낸 json을 req.body에 넣어줌
app.use(express.urlencoded({ extended: true })); // form submit data를 req.body에 넣어줌
// 미들웨어
app.use(cookieParser(process.env.COOKIE_SECRET)); // 브라우저는 쿠키를 저장해서 판단(보안때문에 정보를 보내지않고 쿠키를 보냄) , 서버는 세션
app.use(session({ saveUninitialized: false, resave: false, secret: process.env.COOKIE_SECRET }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
  res.send('hello');
});

app.use('/post', postRouter); // 한개의 post만
app.use('/posts', postsRouter);
app.use('/user', userRouter);
app.use('/hashtag', hashtagRouter);

// 에러 처리 미들웨어 (기본적으로 내장되어 있는데 바꾸고싶으면 따로 만들어줌)
app.use((err, req, res, next) => {});

app.listen(80, () => {
  console.log('서버실행중');
});
