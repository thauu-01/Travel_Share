import express from 'express';
const router = express.Router();
import chatController from '../controllers/chat.controller.js';
import adminController from '../controllers/admin.controller.js';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware.js';
import { validateSendMessage } from '../validators/chat.validator.js';

// Admin support chat management routes
router.get('/admin/threads', authenticate, requireAdmin, adminController.getSupportConversations);
router.get('/admin/:userId', authenticate, requireAdmin, adminController.getSupportMessages);
router.post('/admin/:userId/send', authenticate, requireAdmin, adminController.sendSupportReply);

// User chat routes
router.get('/messages', authenticate, chatController.getMessages);
router.post('/send', authenticate, validateSendMessage, chatController.sendMessage);

export default router;
