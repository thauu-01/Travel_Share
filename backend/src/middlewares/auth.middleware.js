import { verifyAccessToken } from '../utils/token.util.js';
import ApiResponse from '../utils/apiResponse.js';

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponse.error(res, 'Vui lòng đăng nhập để tiếp tục', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.error(res, 'Token đã hết hạn, vui lòng đăng nhập lại', 401);
    }
    return ApiResponse.error(res, 'Token không hợp lệ', 401);
  }
};

export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyAccessToken(token);
      req.user = decoded;
    }
  } catch {
    // Token không hợp lệ thì bỏ qua
  }
  next();
};

export const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return ApiResponse.error(res, 'Bạn không có quyền truy cập', 403);
};

export default {
  authenticate,
  optionalAuth,
  requireAdmin
};
