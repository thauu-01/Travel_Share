import notificationRepository from '../repositories/notification.repository.js';

class NotificationService {
  async getUserNotifications(userId) {
    return await notificationRepository.getUserNotifications(userId);
  }

  async markAsRead(notificationId, userId) {
    await notificationRepository.markAsRead(notificationId, userId);
    return { message: 'Đã đánh dấu đã đọc' };
  }

  async markAllAsRead(userId) {
    await notificationRepository.markAllAsRead(userId);
    return { message: 'Đã đánh dấu tất cả đã đọc' };
  }
}

const serviceInstance = new NotificationService();
export { serviceInstance as NotificationService };
export default serviceInstance;
