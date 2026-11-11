import authService from '../services/auth.service.js';
import { setRefreshCookie, clearRefreshCookie } from '../utils/token.util.js';
import ApiResponse from '../utils/apiResponse.js';

class AuthController {
  async register(req, res, next) {
    try {
      const { user, accessToken, refreshToken } = await authService.register(req.body);
      setRefreshCookie(res, refreshToken);
      return ApiResponse.created(res, { token: accessToken, user }, 'Đăng ký thành công');
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const { user, accessToken, refreshToken } = await authService.login(req.body);
      setRefreshCookie(res, refreshToken);
      return ApiResponse.success(res, { token: accessToken, user }, 'Đăng nhập thành công');
    } catch (err) {
      next(err);
    }
  }

  async refresh(req, res, next) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      const result = await authService.refresh(refreshToken);
      setRefreshCookie(res, result.refreshToken);
      return ApiResponse.success(res, { token: result.accessToken, user: result.user });
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res) {
    clearRefreshCookie(res);
    return ApiResponse.success(res, null, 'Đăng xuất thành công');
  }

  async getMe(req, res, next) {
    try {
      const user = await authService.getMe(req.user.id);
      return ApiResponse.success(res, user);
    } catch (err) {
      next(err);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const result = await authService.forgotPassword(req.body.email);
      return ApiResponse.success(res, null, result.message);
    } catch (err) {
      next(err);
    }
  }

  async verifyOtp(req, res, next) {
    try {
      const { email, otp } = req.body;
      const result = await authService.verifyOtp(email, otp);
      return ApiResponse.success(res, result, 'Xác minh OTP thành công');
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { resetToken, newPassword } = req.body;
      const result = await authService.resetPassword(resetToken, newPassword);
      return ApiResponse.success(res, null, result.message);
    } catch (err) {
      next(err);
    }
  }
}

const controllerInstance = new AuthController();
export { controllerInstance as AuthController };
export default controllerInstance;
