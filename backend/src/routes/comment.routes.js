import express from 'express';
const router = express.Router({ mergeParams: true });
import commentController from '../controllers/comment.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { createContentLimiter } from '../middlewares/rateLimiter.middleware.js';
import { validateCreateComment } from '../validators/comment.validator.js';

router.get('/', commentController.getByPost);
router.post('/', authenticate, createContentLimiter, validateCreateComment, commentController.create);
router.delete('/:commentId', authenticate, commentController.delete);
router.delete('/:id', authenticate, commentController.delete);

export default router;
