import express from 'express';
const router = express.Router();
import notificationController from '../controllers/notification.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

router.get('/', authenticate, notificationController.getAll);
router.patch('/read-all', authenticate, notificationController.markAllRead);
router.patch('/:id/read', authenticate, notificationController.markAsRead);

export default router;
