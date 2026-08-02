const router = require('express').Router();
const post = require('../controllers/PostController');
const admin = require('../controllers/AdminController');
const { authenticate, optionalAuth, requireAdmin } = require('../middlewares/auth');
const { uploadMultiple, handleUploadError } = require('../middlewares/upload');
const { createContentLimiter } = require('../middlewares/rateLimiter');

// Public/User routes
router.get('/', optionalAuth, post.getAll);
router.get('/trending', post.getTrending);
router.get('/:id', optionalAuth, post.getById);
router.post('/', authenticate, createContentLimiter, uploadMultiple, handleUploadError, post.create);
router.put('/:id', authenticate, uploadMultiple, handleUploadError, post.update);
router.delete('/:id', authenticate, post.delete);
router.post('/:id/like', authenticate, post.toggleLike);

// Admin post management routes
router.get('/admin/list', authenticate, requireAdmin, admin.getPosts);
router.patch('/:id/visibility', authenticate, requireAdmin, admin.togglePostVisibility);
router.delete('/:id/admin', authenticate, requireAdmin, admin.deletePost);

module.exports = router;
