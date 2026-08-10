const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/PaymentController');
const { authenticate } = require('../middlewares/auth');

// Kiểm tra role admin
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Chỉ Admin mới có quyền truy cập' });
  }
  next();
};

// User routes (cần đăng nhập)
router.post('/vnpay-create', authenticate, paymentController.createPaymentUrl);
router.get('/vnpay-return', paymentController.vnpayReturn);          // public — redirect từ VNPay
router.get('/vnpay-ipn', paymentController.vnpayIpn);               // public — VNPay server gọi
router.get('/status/:txn_ref', authenticate, paymentController.getPaymentStatus);

// Admin routes
router.get('/admin/transactions', authenticate, adminOnly, paymentController.adminGetTransactions);

module.exports = router;
