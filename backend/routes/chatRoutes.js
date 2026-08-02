const express = require('express');
const router = express.Router();
const chatController = require('../controllers/ChatController');
const admin = require('../controllers/AdminController');
const { authenticate, optionalAuth, requireAdmin } = require('../middlewares/auth');

// User & Guest support chat routes
router.get('/history', optionalAuth, chatController.getHistory);
router.post('/send', optionalAuth, chatController.sendMessage);

// Admin support chat management routes
router.get('/admin/threads', authenticate, requireAdmin, admin.getSupportChats);
router.get('/admin/:userId', authenticate, requireAdmin, admin.getChatHistory);
router.post('/admin/:userId/send', authenticate, requireAdmin, admin.sendAdminMessage);

module.exports = router;
