import express from 'express';
const router = express.Router();
import notificationController from '../controllers/notification.controller.js';
import adminController from '../controllers/admin.controller.js';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware.js';

// Admin broadcast route
router.post('/broadcast', authenticate, requireAdmin, adminController.broadcastNotification);

// User notification routes
router.get('/', authenticate, notificationController.getAll);
router.patch('/read-all', authenticate, notificationController.markAllRead);
router.patch('/:id/read', authenticate, notificationController.markAsRead);

export default router;
