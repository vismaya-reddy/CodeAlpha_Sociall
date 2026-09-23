const express = require('express');
const router = express.Router();
const { deleteComment } = require('../controllers/comments.controller');
const { authenticate } = require('../middleware/auth');

router.delete('/:id', authenticate, deleteComment);

module.exports = router;
