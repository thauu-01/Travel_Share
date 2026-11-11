import express from 'express';
const router = express.Router();
import chatController from '../controllers/chat.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validateSendMessage } from '../validators/chat.validator.js';

router.get('/messages', authenticate, chatController.getMessages);
router.post('/send', authenticate, validateSendMessage, chatController.sendMessage);

export default router;
