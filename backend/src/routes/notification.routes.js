import express from 'express';
const router = express.Router();
import notificationController from '../controllers/notification.controller.js';
import adminController from '../controllers/admin.controller.js';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware.js';

// Admin broadcast route
router.post('/broadcast', authenticate, requireAdmin, adminController.broadcastNotification);

// User notification routes (support both PUT and PATCH)
router.get('/', authenticate, notificationController.getAll);
router.put('/read-all', authenticate, notificationController.markAllRead);
router.patch('/read-all', authenticate, notificationController.markAllRead);
router.put('/:id/read', authenticate, notificationController.markAsRead);
router.patch('/:id/read', authenticate, notificationController.markAsRead);

export default router;
