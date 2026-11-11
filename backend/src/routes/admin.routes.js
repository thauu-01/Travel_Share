import express from 'express';
const router = express.Router();
import adminController from '../controllers/admin.controller.js';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware.js';

router.use(authenticate, requireAdmin);

router.get('/dashboard', adminController.getDashboard);
router.get('/transactions', adminController.getTransactions);
router.get('/support/conversations', adminController.getSupportConversations);
router.get('/support/:userId/messages', adminController.getSupportMessages);
router.post('/support/:userId/reply', adminController.sendSupportReply);

export default router;
