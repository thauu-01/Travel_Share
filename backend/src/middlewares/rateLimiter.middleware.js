import rateLimit from 'express-rate-limit';

const skipInTest = () => process.env.NODE_ENV === 'test' || process.env.ALLOW_TEST_OTP === 'true';

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  skip: skipInTest,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Bạn đã gửi quá nhiều yêu cầu lên hệ thống. Vui lòng thử lại sau 15 phút.'
  }
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  skip: skipInTest,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Quá nhiều lần thao tác đăng nhập/đăng ký. Vui lòng thử lại sau 15 phút.'
  }
});

export const chatLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
  skip: skipInTest,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Bạn đang gửi quá nhiều tin nhắn. Vui lòng chờ ít phút rồi tiếp tục nhé.'
  }
});

export const createContentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
  skip: skipInTest,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Bạn thao tác đăng bài/bình luận quá nhanh. Vui lòng thử lại sau ít phút.'
  }
});

export default {
  globalLimiter,
  authLimiter,
  chatLimiter,
  createContentLimiter
};
