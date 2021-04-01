const express = require('express');
const multer = require('multer'); // 개별적으로 폼마다 파일업로드가 다르기 때문에 app에 X
const path = require('path');
const fs = require('fs');

const { User, Post, Image, Comment, Hashtag } = require('../models');
const { isLoggedIn } = require('./middlewares');

const router = express.Router();

try {
  fs.accessSync('uploads'); // 폴더 검사
} catch (error) {
  console.log('uploads 폴더가 없으므로 생성합니다.');
  fs.mkdirSync('uploads');
}

// 실습이니까 하드디스크에 저장
const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, done) {
      done(null, 'uploads');
    },
    filename(req, file, done) {
      // 제로초.png
      const ext = path.extname(file.originalname); // 확장자 추출(.png)
      const basename = path.basename(file.originalname, ext); // 제로초
      done(null, basename + '_' + new Date().getTime() + ext); // 제로초15184712891.png
    }
  }),
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB
});

// POST /post
router.post('/', isLoggedIn, upload.none(), async (req, res, next) => {
  try {
    const hashtags = req.body.content.match(/#[^\s#]+/g);
    const post = await Post.create({
      content: req.body.content,
      UserId: req.user.id // deserializeUser 실행해서 저장한 id 사용
    });
    // findOrCreate 없으면 등록 (where넣어줘야함)
    if (hashtags) {
      const result = await Promise.all(
        hashtags.map((tag) =>
          Hashtag.findOrCreate({
            where: { name: tag.slice(1).toLowerCase() }
          })
        )
      ); // [[노드, true], [리액트, true]]
      await post.addHashtags(result.map((v) => v[0]));
    }
    if (req.body.image) {
      // 이미 여러개 올리면image: [a.png, b.png] 배열로
      if (Array.isArray(req.body.image)) {
        const images = await Promise.all(req.body.image.map((image) => Image.create({ src: image })));
        await post.addImages(images);
        // 이미지를 하나만 올리면 image: a.png
      } else {
        const image = await Image.create({ src: req.body.image });
        await post.addImages(image);
      }
    }
    const fullPost = await Post.findOne({
      where: { id: post.id },
      include: [
        {
          model: Image
        },
        {
          model: Comment,
          include: [
            {
              model: User, // 댓글 작성자
              attributes: ['id', 'nickname']
            }
          ]
        },
        {
          model: User, // 게시글 작성자
          attributes: ['id', 'nickname']
        },
        {
          model: User, // 좋아요 누른사람
          as: 'Likers', // 구분
          attributes: ['id']
        }
      ]
    });
    res.status(201).json(fullPost);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// POST /post/images
//  <input type="file" name="image" <<< 에서 upload.array('image') image!
// 여러장 array, 한장 single, text만있다(json) none
// upload.array('image') < 이미지를 이미 올려줌
router.post('/images', isLoggedIn, upload.array('image'), (req, res, next) => {
  // 이미지올린 후
  console.log(req.files);
  res.json(req.files.map((v) => v.filename));
});

// POST /post/1/retweet
router.post('/:postId/retweet', isLoggedIn, async (req, res, next) => {
  try {
    const post = await Post.findOne({
      where: { id: req.params.postId },
      include: [
        {
          model: Post,
          as: 'Retweet'
        }
      ]
    });
    if (!post) {
      return res.status(403).send('존재하지 않는 게시글입니다.');
    }
    // 자기글을 리트윗했을 경우 || 내 글을 리트윗한 글을 리트윗했을 경우
    if (req.user.id === post.UserId || (post.Retweet && post.Retweet.UserId === req.user.id)) {
      return res.status(403).send('자신의 글은 리트윗할 수 없습니다.');
    }
    // 다른글을 리트윗한 글을 리트윗할 경우 => RetweetId를 가져옴
    const retweetTargetId = post.RetweetId || post.id;
    const exPost = await Post.findOne({
      where: {
        UserId: req.user.id,
        RetweetId: retweetTargetId
      }
    });
    // 다른글을 리트윗한 글을 이미 리트윗했을 경우
    if (exPost) {
      return res.status(403).send('이미 리트윗했습니다.');
    }
    const retweet = await Post.create({
      UserId: req.user.id,
      RetweetId: retweetTargetId,
      content: 'retweet' // 무조건 넣어야해서 임의로 글넣어놈
    });
    const retweetWithPrevPost = await Post.findOne({
      where: { id: retweet.id },
      include: [
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
        },
        {
          model: User,
          attributes: ['id', 'nickname']
        },
        {
          model: User,
          as: 'Likers',
          attributes: ['id']
        },
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
        }
      ]
    });

    res.status(201).json(retweetWithPrevPost);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// POST /post/:postId/comment
router.post('/:postId/comment', isLoggedIn, async (req, res, next) => {
  try {
    const post = await Post.findOne({
      where: { id: req.params.postId }
    });
    if (!post) {
      return res.status(403).send('존재하지 않는 게시글입니다.');
    }
    const comment = await Comment.create({
      content: req.body.content,
      PostId: parseInt(req.params.postId),
      UserId: req.user.id
    });
    const fullComment = await Comment.findOne({
      where: { id: comment.id },
      include: [
        {
          model: User,
          attributes: ['id', 'nickname']
        }
      ]
    });
    res.status(201).json(fullComment);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// PATCH /post/1/like
router.patch('/:postId/like', isLoggedIn, async (req, res, next) => {
  try {
    const post = await Post.findOne({ where: { id: req.params.postId } });
    if (!post) {
      return res.status(403).send('게시글이 존재하지 않습니다.');
    }
    await post.addLikers(req.user.id);
    res.json({ PostId: post.id, UserId: req.user.id });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// DELETE /post/1/like
router.delete('/:postId/like', isLoggedIn, async (req, res, next) => {
  try {
    const post = await Post.findOne({ where: { id: req.params.postId } });
    if (!post) {
      return res.status(403).send('게시글이 존재하지 않습니다.');
    }
    await post.removeLikers(req.user.id);
    res.json({ PostId: post.id, UserId: req.user.id });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// DELETE /post/10
router.delete('/:postId', isLoggedIn, async (req, res, next) => {
  try {
    await Post.destroy({ where: { id: req.params.postId, UserId: req.user.id } });
    res.json({ PostId: parseInt(req.params.postId, 10) });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
