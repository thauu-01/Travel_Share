import BaseRepository from './base.repository.js';
import { Notification } from '../models/index.js';

class NotificationRepository extends BaseRepository {
  constructor() {
    super(Notification);
  }

  async getUserNotifications(userId, limit = 50) {
    const notifications = await this.model.find({ user_id: userId })
      .populate('fromUser', 'id full_name avatar_url')
      .populate('post', 'id title')
      .sort({ created_at: -1 })
      .limit(limit);

    const unreadCount = await this.model.countDocuments({ user_id: userId, is_read: false });
    return { notifications, unreadCount };
  }

  async markAsRead(notificationId, userId) {
    return await this.model.updateOne({ _id: notificationId, user_id: userId }, { is_read: true });
  }

  async markAllAsRead(userId) {
    return await this.model.updateMany({ user_id: userId, is_read: false }, { is_read: true });
  }
}

const repoInstance = new NotificationRepository();
export { repoInstance as NotificationRepository };
export default repoInstance;
