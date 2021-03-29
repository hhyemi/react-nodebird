const express = require('express');

const router = express.Router();

// POST /post
router.post('/', (req, res) => {
  res.json({ id: 1, content: 'hello' });
});

// DELETE /post
router.delete('/', (req, res) => {
  res.json({ id: 1 });
});

module.exports = router;
