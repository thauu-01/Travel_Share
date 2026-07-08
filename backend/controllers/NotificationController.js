const { Notification, User, Post } = require('../models');

class NotificationController {
  async getAll(req, res) {
    try {
      const notifications = await Notification.find({ user_id: req.user.id })
        .populate('fromUser', 'id full_name avatar_url')
        .populate('post', 'id title')
        .sort({ created_at: -1 })
        .limit(50);
      const unreadCount = await Notification.countDocuments({ user_id: req.user.id, is_read: false });
      res.json({ success: true, data: { notifications, unreadCount } });
    } catch (error) {
      console.error('GetNotifications error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  async markAsRead(req, res) {
    try {
      await Notification.updateOne({ _id: req.params.id, user_id: req.user.id }, { is_read: true });
      res.json({ success: true, message: 'Đã đánh dấu đã đọc' });
    } catch (error) {
      console.error('MarkAsRead error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  async markAllRead(req, res) {
    try {
      await Notification.updateMany({ user_id: req.user.id, is_read: false }, { is_read: true });
      res.json({ success: true, message: 'Đã đánh dấu tất cả đã đọc' });
    } catch (error) {
      console.error('MarkAllRead error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }
}

module.exports = new NotificationController();
