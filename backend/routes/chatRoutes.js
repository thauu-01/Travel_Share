const express = require('express');
const router = express.Router();
const chatController = require('../controllers/ChatController');
const admin = require('../controllers/AdminController');
const { authenticate, requireAdmin } = require('../middlewares/auth');

// User support chat routes
router.get('/history', authenticate, chatController.getHistory);
router.post('/send', authenticate, chatController.sendMessage);

// Admin support chat management routes
router.get('/admin/threads', authenticate, requireAdmin, admin.getSupportChats);
router.get('/admin/:userId', authenticate, requireAdmin, admin.getChatHistory);
router.post('/admin/:userId/send', authenticate, requireAdmin, admin.sendAdminMessage);

module.exports = router;
