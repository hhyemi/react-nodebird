const express = require('express');

const { Post, User, Image, Comment } = require('../models');

const router = express.Router();

// GET /posts
router.get('/', async (req, res, next) => {
  try {
    const posts = await Post.findAll({
      //where: { id: lastId },
      limit: 10,
      // offset: 10, // 불러오는 중에 글을 쓰거나 지웠을때 글이 제대로 안불러짐(쓰지x)
      order: [
        ['createdAt', 'DESC'], // 글 생성일 먼저
        [Comment, 'createdAt', 'DESC'] // 댓글 생성일
      ],
      include: [
        {
          model: User,
          attributes: ['id', 'nickname'] // 보안상 비밀번호는 빼주기
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
              //order: [['createdAt', 'DESC']]
            }
          ]
        },
        {
          model: User, // 좋아요 누른사람
          as: 'Likers', // 구분
          attributes: ['id']
        }
      ]
    });
    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
