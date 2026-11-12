import express from 'express';
const router = express.Router();
import paymentController from '../controllers/payment.controller.js';
import adminController from '../controllers/admin.controller.js';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware.js';
import { validateCreatePayment } from '../validators/payment.validator.js';

// Admin transactions route
router.get('/admin/transactions', authenticate, requireAdmin, adminController.getTransactions);

// User & Payment gateway routes
router.post('/vnpay-create', authenticate, validateCreatePayment, paymentController.createPaymentUrl);
router.get('/vnpay-return', paymentController.vnpayReturn);
router.get('/vnpay-ipn', paymentController.vnpayIpn);
router.get('/history', authenticate, paymentController.getHistory);

export default router;
