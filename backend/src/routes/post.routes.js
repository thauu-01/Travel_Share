import express from 'express';
const router = express.Router();
import postController from '../controllers/post.controller.js';
import adminController from '../controllers/admin.controller.js';
import { authenticate, optionalAuth, requireAdmin } from '../middlewares/auth.middleware.js';
import { uploadMultiple, handleUploadError } from '../middlewares/upload.middleware.js';
import { createContentLimiter } from '../middlewares/rateLimiter.middleware.js';
import { validateCreatePost, validateUpdatePost } from '../validators/post.validator.js';

// Public/User routes
router.get('/', optionalAuth, postController.getAll);
router.get('/trending', postController.getTrending);
router.get('/:id', optionalAuth, postController.getById);
router.post(
  '/',
  authenticate,
  createContentLimiter,
  uploadMultiple,
  handleUploadError,
  validateCreatePost,
  postController.create
);
router.put(
  '/:id',
  authenticate,
  uploadMultiple,
  handleUploadError,
  validateUpdatePost,
  postController.update
);
router.delete('/:id', authenticate, postController.delete);
router.post('/:id/like', authenticate, postController.toggleLike);

// Admin post management routes
router.get('/admin/list', authenticate, requireAdmin, adminController.getPosts);
router.patch('/:id/visibility', authenticate, requireAdmin, adminController.togglePostVisibility);
router.delete('/:id/admin', authenticate, requireAdmin, adminController.deletePost);

export default router;
