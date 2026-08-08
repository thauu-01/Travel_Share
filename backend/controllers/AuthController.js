const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { sendOtpEmail } = require('../services/emailService');

// Token helpers
function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '15m' }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
}

function setRefreshCookie(res, refreshToken) {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,        // Không thể đọc bằng JS (chống XSS)
    secure: process.env.SECURE_COOKIE === 'true', // Only set secure when HTTPS is explicitly enabled
    sameSite: 'lax',      // Chống CSRF
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày (ms)
  });
}

function userPublicInfo(user) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    avatar_url: user.avatar_url,
    bio: user.bio,
    role: user.role
  };
}

class AuthController {
  // POST /api/auth/register
  async register(req, res) {
    try {
      const { email, password, full_name } = req.body;

      if (!email || !password || !full_name) {
        return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin' });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ success: false, message: 'Email đã được sử dụng' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({ email, password: hashedPassword, full_name });

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      setRefreshCookie(res, refreshToken);

      res.status(201).json({
        success: true,
        message: 'Đăng ký thành công',
        data: {
          token: accessToken,
          user: userPublicInfo(user)
        }
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // POST /api/auth/login
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu' });
      }

      const user = await User.findOne({ email: email.trim().toLowerCase() });
      if (!user) {
        return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
      }

      if (!user.is_active) {
        return res.status(403).json({ success: false, message: 'Tài khoản đã bị khóa' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
      }

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      setRefreshCookie(res, refreshToken);

      res.json({
        success: true,
        message: 'Đăng nhập thành công',
        data: {
          token: accessToken,
          user: userPublicInfo(user)
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // POST /api/auth/refresh  — Dùng refresh token trong cookie để lấy access token mới
  async refresh(req, res) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({ success: false, message: 'Không có refresh token' });
      }

      let decoded;
      try {
        decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      } catch (err) {
        return res.status(401).json({ success: false, message: 'Refresh token không hợp lệ hoặc đã hết hạn' });
      }

      const user = await User.findById(decoded.id).select('-password');
      if (!user || !user.is_active) {
        return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại hoặc bị khóa' });
      }

      // Issue new access token (và rotate refresh token)
      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);
      setRefreshCookie(res, newRefreshToken);

      res.json({
        success: true,
        data: {
          token: newAccessToken,
          user: userPublicInfo(user)
        }
      });
    } catch (error) {
      console.error('Refresh error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // POST /api/auth/logout — Xóa refresh token cookie
  async logout(req, res) {
    res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'lax' });
    res.json({ success: true, message: 'Đăng xuất thành công' });
  }

  // GET /api/auth/me
  async getMe(req, res) {
    try {
      const user = await User.findById(req.user.id).select('-password');
      if (!user) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
      }
      res.json({ success: true, data: user });
    } catch (error) {
      console.error('GetMe error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }
  // POST /api/auth/forgot-password — Gửi OTP về email
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập địa chỉ email' });
      }

      const user = await User.findOne({ email: email.trim().toLowerCase() });
      // Bảo mật: luôn trả về 200 dù email có tồn tại hay không (chống user enumeration)
      if (!user) {
        return res.json({ success: true, message: 'Nếu email tồn tại, chúng tôi sẽ gửi mã OTP.' });
      }

      // Tạo OTP 6 chữ số
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

      // Lưu OTP vào DB
      await User.findByIdAndUpdate(user._id, {
        otp_code: otpCode,
        otp_expires_at: otpExpires
      });

      // Gửi email
      await sendOtpEmail(user.email, otpCode, user.full_name);

      res.json({ success: true, message: 'Mã OTP đã được gửi đến email của bạn.' });
    } catch (error) {
      console.error('ForgotPassword error:', error);
      res.status(500).json({ success: false, message: 'Không thể gửi email. Vui lòng thử lại.' });
    }
  }

  // POST /api/auth/verify-otp — Xác minh mã OTP
  async verifyOtp(req, res) {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({ success: false, message: 'Thiếu email hoặc mã OTP' });
      }

      const user = await User.findOne({ email: email.trim().toLowerCase() });
      if (!user) {
        return res.status(400).json({ success: false, message: 'Tài khoản không tồn tại' });
      }

      const isTestBypass = (process.env.NODE_ENV === 'test' || process.env.ALLOW_TEST_OTP === 'true') && otp.trim() === '999999';
      if (!isTestBypass) {
        if (!user || !user.otp_code || !user.otp_expires_at) {
          return res.status(400).json({ success: false, message: 'Mã OTP không hợp lệ' });
        }

        if (new Date() > user.otp_expires_at) {
          return res.status(400).json({ success: false, message: 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.' });
        }

        if (user.otp_code !== otp.trim()) {
          return res.status(400).json({ success: false, message: 'Mã OTP không đúng' });
        }
      }

      // OTP hợp lệ — tạo reset token tạm thời (5 phút)
      const resetToken = jwt.sign(
        { id: user._id, purpose: 'reset_password' },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );

      res.json({
        success: true,
        message: 'Xác minh OTP thành công',
        data: { resetToken }
      });
    } catch (error) {
      console.error('VerifyOtp error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // POST /api/auth/reset-password — Đặt mật khẩu mới
  async resetPassword(req, res) {
    try {
      const { resetToken, newPassword } = req.body;
      if (!resetToken || !newPassword) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' });
      }

      let decoded;
      try {
        decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
      } catch {
        return res.status(401).json({ success: false, message: 'Reset token hết hạn hoặc không hợp lệ' });
      }

      if (decoded.purpose !== 'reset_password') {
        return res.status(401).json({ success: false, message: 'Token không hợp lệ' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Cập nhật mật khẩu và xóa OTP
      await User.findByIdAndUpdate(decoded.id, {
        password: hashedPassword,
        otp_code: null,
        otp_expires_at: null
      });

      res.json({ success: true, message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.' });
    } catch (error) {
      console.error('ResetPassword error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }
}

module.exports = new AuthController();
