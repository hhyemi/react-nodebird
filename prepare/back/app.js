const express = require('express');
const postRouter = require('./routes/post');
const db = require('./models');
const app = express();

db.sequelize
  .sync()
  .then(() => {
    console.log('db연결 성공!');
  })
  .catch(console.error);

app.get('/', (req, res) => {
  res.send('hello');
});

app.get('/api', (req, res) => {
  res.send('hello');
});

app.use('/post', postRouter);

app.listen(3065, () => {
  console.log('서버실행중');
});
