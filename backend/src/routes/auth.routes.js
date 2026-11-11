import express from 'express';
const router = express.Router();
import authController from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateVerifyOtp,
  validateResetPassword
} from '../validators/auth.validator.js';

router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/forgot-password', validateForgotPassword, authController.forgotPassword);
router.post('/verify-otp', validateVerifyOtp, authController.verifyOtp);
router.post('/reset-password', validateResetPassword, authController.resetPassword);
router.get('/me', authenticate, authController.getMe);

export default router;
