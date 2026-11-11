import { validate } from './validate.js';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const registerRules = [
  (req) => {
    const { email, password, full_name } = req.body || {};
    if (!email || !password || !full_name) {
      return 'Vui lòng điền đầy đủ thông tin (email, password, full_name)';
    }
    if (!emailRegex.test(email.trim())) {
      return 'Địa chỉ email không hợp lệ';
    }
    if (password.length < 6) {
      return 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    return null;
  }
];

const loginRules = [
  (req) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return 'Vui lòng nhập email và mật khẩu';
    }
    return null;
  }
];

const forgotPasswordRules = [
  (req) => {
    const { email } = req.body || {};
    if (!email) {
      return 'Vui lòng nhập địa chỉ email';
    }
    if (!emailRegex.test(email.trim())) {
      return 'Địa chỉ email không hợp lệ';
    }
    return null;
  }
];

const verifyOtpRules = [
  (req) => {
    const { email, otp } = req.body || {};
    if (!email || !otp) {
      return 'Thiếu email hoặc mã OTP';
    }
    return null;
  }
];

const resetPasswordRules = [
  (req) => {
    const { resetToken, newPassword } = req.body || {};
    if (!resetToken || !newPassword) {
      return 'Thiếu thông tin đặt lại mật khẩu';
    }
    if (newPassword.length < 6) {
      return 'Mật khẩu mới phải có ít nhất 6 ký tự';
    }
    return null;
  }
];

export const validateRegister = validate(registerRules);
export const validateLogin = validate(loginRules);
export const validateForgotPassword = validate(forgotPasswordRules);
export const validateVerifyOtp = validate(verifyOtpRules);
export const validateResetPassword = validate(resetPasswordRules);

export default {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateVerifyOtp,
  validateResetPassword
};
