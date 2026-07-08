const router = require('express').Router();
const user = require('../controllers/UserController');
const admin = require('../controllers/AdminController');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { uploadSingle, handleUploadError } = require('../middlewares/upload');

// Admin user management routes
router.get('/', authenticate, requireAdmin, admin.getUsers);
router.patch('/:id/ban', authenticate, requireAdmin, admin.banUser);
router.patch('/:id/role', authenticate, requireAdmin, admin.updateUserRole);

// Regular user routes
router.get('/liked-posts', authenticate, user.getLikedPosts);
router.get('/:id', user.getProfile);
router.put('/profile', authenticate, uploadSingle, handleUploadError, user.updateProfile);
router.get('/:id/posts', user.getUserPosts);

module.exports = router;
