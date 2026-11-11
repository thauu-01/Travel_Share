import express from 'express';
const router = express.Router();
import paymentController from '../controllers/payment.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validateCreatePayment } from '../validators/payment.validator.js';

router.post('/vnpay-create', authenticate, validateCreatePayment, paymentController.createPaymentUrl);
router.get('/vnpay-return', paymentController.vnpayReturn);
router.get('/vnpay-ipn', paymentController.vnpayIpn);
router.get('/history', authenticate, paymentController.getHistory);

export default router;
