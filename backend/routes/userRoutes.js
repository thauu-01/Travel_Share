const router = require('express').Router();
const user = require('../controllers/UserController');
const { authenticate } = require('../middlewares/auth');
const { uploadSingle, handleUploadError } = require('../middlewares/upload');

router.get('/liked-posts', authenticate, user.getLikedPosts);
router.get('/:id', user.getProfile);
router.put('/profile', authenticate, uploadSingle, handleUploadError, user.updateProfile);
router.get('/:id/posts', user.getUserPosts);

module.exports = router;
