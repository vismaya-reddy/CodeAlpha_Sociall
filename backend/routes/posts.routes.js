const express = require('express');
const router = express.Router();
const { getFeed, getUserPosts, createPost, deletePost, toggleLike } = require('../controllers/posts.controller');
const { getComments, addComment } = require('../controllers/comments.controller');
const { authenticate, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', optionalAuth, getFeed);
router.post('/', authenticate, upload.single('image'), createPost);
router.get('/user/:username', optionalAuth, getUserPosts);
router.delete('/:id', authenticate, deletePost);

router.post('/:postId/like', authenticate, toggleLike);
router.get('/:postId/comments', getComments);
router.post('/:postId/comments', authenticate, addComment);

module.exports = router;
