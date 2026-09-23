const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, searchUsers } = require('../controllers/users.controller');
const { toggleFollow, getFollowers, getFollowing } = require('../controllers/follow.controller');
const { authenticate, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

// NOTE: specific routes ('/search', '/me') must come before the dynamic '/:username' route
router.get('/search', optionalAuth, searchUsers);
router.put('/me', authenticate, upload.single('avatar'), updateProfile);

router.get('/:username', optionalAuth, getProfile);
router.post('/:username/follow', authenticate, toggleFollow);
router.get('/:username/followers', getFollowers);
router.get('/:username/following', getFollowing);

module.exports = router;
