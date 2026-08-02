const router = require('express').Router();
const auth = require('../controllers/AuthController');
const { authenticate } = require('../middlewares/auth');

router.post('/register', auth.register);
router.post('/login', auth.login);
router.post('/refresh', auth.refresh);
router.post('/logout', auth.logout);
router.post('/forgot-password', auth.forgotPassword);  // Bước 1: Gửi OTP
router.post('/verify-otp', auth.verifyOtp);            // Bước 2: Xác minh OTP
router.post('/reset-password', auth.resetPassword);    // Bước 3: Đặt mật khẩu mới
router.get('/me', authenticate, auth.getMe);

module.exports = router;
