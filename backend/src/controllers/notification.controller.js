import notificationService from '../services/notification.service.js';
import ApiResponse from '../utils/apiResponse.js';

class NotificationController {
  async getAll(req, res, next) {
    try {
      const data = await notificationService.getUserNotifications(req.user.id);
      return ApiResponse.success(res, data);
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const result = await notificationService.markAsRead(req.params.id, req.user.id);
      return ApiResponse.success(res, null, result.message);
    } catch (err) {
      next(err);
    }
  }

  async markAllRead(req, res, next) {
    try {
      const result = await notificationService.markAllAsRead(req.user.id);
      return ApiResponse.success(res, null, result.message);
    } catch (err) {
      next(err);
    }
  }
}

const controllerInstance = new NotificationController();
export { controllerInstance as NotificationController };
export default controllerInstance;
