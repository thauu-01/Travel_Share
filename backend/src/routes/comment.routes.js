import express from 'express';
const router = express.Router({ mergeParams: true });
import commentController from '../controllers/comment.controller.js';
import adminController from '../controllers/admin.controller.js';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware.js';
import { createContentLimiter } from '../middlewares/rateLimiter.middleware.js';
import { validateCreateComment } from '../validators/comment.validator.js';

// Admin routes (đặt trước các route có param /:id để tránh trùng khớp)
router.get('/admin/all', authenticate, requireAdmin, adminController.getComments);
router.delete('/admin/:id', authenticate, requireAdmin, adminController.deleteComment);

// User routes
router.get('/', commentController.getByPost);
router.post('/', authenticate, createContentLimiter, validateCreateComment, commentController.create);
router.delete('/:commentId', authenticate, commentController.delete);
router.delete('/:id', authenticate, commentController.delete);

export default router;
