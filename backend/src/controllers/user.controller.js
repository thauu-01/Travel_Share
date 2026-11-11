import userService from '../services/user.service.js';
import ApiResponse from '../utils/apiResponse.js';

class UserController {
  async getProfile(req, res, next) {
    try {
      const data = await userService.getProfile(req.params.id);
      return ApiResponse.success(res, data);
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const updatedUser = await userService.updateProfile(req.user.id, req.body, req.file);
      return ApiResponse.success(res, updatedUser, 'Cập nhật thành công');
    } catch (err) {
      next(err);
    }
  }

  async getUserPosts(req, res, next) {
    try {
      const posts = await userService.getUserPosts(req.params.id, req.user?.id, req.user?.role);
      return ApiResponse.success(res, posts);
    } catch (err) {
      next(err);
    }
  }

  async getLikedPosts(req, res, next) {
    try {
      const posts = await userService.getLikedPosts(req.user.id);
      return ApiResponse.success(res, posts);
    } catch (err) {
      next(err);
    }
  }
}

const controllerInstance = new UserController();
export { controllerInstance as UserController };
export default controllerInstance;
