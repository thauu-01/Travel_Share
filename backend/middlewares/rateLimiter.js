const rateLimit = require('express-rate-limit');

// 1. Global API rate limiter - Áp dụng cho toàn bộ /api
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 300, // Tối đa 300 request / 15 phút / IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Bạn đã gửi quá nhiều yêu cầu lên hệ thống. Vui lòng thử lại sau 15 phút.'
  }
});

// 2. Auth rate limiter - Áp dụng cho Đăng nhập & Đăng ký (chống Brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 15, // Tối đa 15 lần thử / 15 phút / IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Quá nhiều lần thao tác đăng nhập/đăng ký. Vui lòng thử lại sau 15 phút.'
  }
});

// 3. Chat rate limiter - Áp dụng cho Chat AI / Hỗ trợ CSKH (tránh quá tải Gemini AI API)
const chatLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 phút
  max: 30, // Tối đa 30 tin nhắn / 10 phút / IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Bạn đang gửi quá nhiều tin nhắn. Vui lòng chờ ít phút rồi tiếp tục nhé.'
  }
});

// 4. Create Content limiter - Áp dụng cho Đăng bài, Bình luận, Báo cáo (chống Spam)
const createContentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 phút
  max: 20, // Tối đa 20 nội dung / 10 phút / IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Bạn thao tác đăng bài/bình luận quá nhanh. Vui lòng thử lại sau ít phút.'
  }
});

module.exports = {
  globalLimiter,
  authLimiter,
  chatLimiter,
  createContentLimiter
};
