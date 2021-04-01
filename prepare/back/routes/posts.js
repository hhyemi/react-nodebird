const express = require('express');
const { Op } = require('sequelize');
const { Post, User, Image, Comment } = require('../models');

const router = express.Router();

// GET /posts
router.get('/', async (req, res, next) => {
  try {
    const where = {};
    // 초기 로딩이 아닐 때
    if (parseInt(req.query.lastId, 10)) {
      // 0 == false
      // Op.lt : operator 연산자
      where.id = { [Op.lt]: parseInt(req.query.lastId, 10) }; // lastId보다 작은
    }
    const posts = await Post.findAll({
      where,
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
    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
