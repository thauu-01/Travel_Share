import appEventEmitter from './eventEmitter.js';
import eventTypes from './eventTypes.js';
import { Notification } from '../models/index.js';

let ioInstance = null;

export function setSocketIO(io) {
  ioInstance = io;
}

export function initNotificationEvents(io) {
  if (io) setSocketIO(io);

  // Khi có bình luận mới
  appEventEmitter.on(eventTypes.COMMENT_CREATED, async ({ post, comment, fromUser }) => {
    try {
      if (!post || !comment || !fromUser) return;
      if (String(post.user_id) === String(fromUser.id)) return;

      const notification = await Notification.create({
        user_id: post.user_id,
        from_user_id: fromUser.id,
        type: 'comment',
        post_id: post.id || post._id,
        message: `${fromUser.full_name || 'Ai đó'} đã bình luận bài viết của bạn`
      });

      if (ioInstance) {
        const notifObj = notification.toObject ? notification.toObject() : { ...notification._doc };
        notifObj.fromUser = fromUser;
        ioInstance.to(`user_${post.user_id}`).emit('notification', notifObj);
      }
    } catch (err) {
      console.error('Error handling COMMENT_CREATED event:', err);
    }
  });

  // Khi có phản hồi bình luận
  appEventEmitter.on(eventTypes.REPLY_CREATED, async ({ parentComment, fromUser, postId }) => {
    try {
      if (!parentComment || !fromUser) return;
      if (String(parentComment.user_id) === String(fromUser.id)) return;

      const notification = await Notification.create({
        user_id: parentComment.user_id,
        from_user_id: fromUser.id,
        type: 'reply',
        post_id: postId,
        message: `${fromUser.full_name || 'Ai đó'} đã trả lời bình luận của bạn`
      });

      if (ioInstance) {
        const notifObj = notification.toObject ? notification.toObject() : { ...notification._doc };
        notifObj.fromUser = fromUser;
        ioInstance.to(`user_${parentComment.user_id}`).emit('notification', notifObj);
      }
    } catch (err) {
      console.error('Error handling REPLY_CREATED event:', err);
    }
  });

  // Khi có like bài viết
  appEventEmitter.on(eventTypes.POST_LIKED, async ({ post, fromUser }) => {
    try {
      if (!post || !fromUser) return;
      if (String(post.user_id) === String(fromUser.id)) return;

      const notification = await Notification.create({
        user_id: post.user_id,
        from_user_id: fromUser.id,
        type: 'like',
        post_id: post.id || post._id,
        message: `${fromUser.full_name || 'Ai đó'} đã thích bài viết của bạn`
      });

      if (ioInstance) {
        const notifObj = notification.toObject ? notification.toObject() : { ...notification._doc };
        notifObj.fromUser = fromUser;
        ioInstance.to(`user_${post.user_id}`).emit('notification', notifObj);
      }
    } catch (err) {
      console.error('Error handling POST_LIKED event:', err);
    }
  });

  // Khi thanh toán VIP thành công
  appEventEmitter.on(eventTypes.PAYMENT_SUCCESS, async ({ userId, credits, orderInfo }) => {
    try {
      const notification = await Notification.create({
        user_id: userId,
        type: 'system',
        message: `Nâng cấp thành công! Bạn đã nhận được ${credits} lượt dùng AI Trip Generator (${orderInfo}).`
      });

      if (ioInstance) {
        const notifObj = notification.toObject ? notification.toObject() : { ...notification._doc };
        ioInstance.to(`user_${userId}`).emit('notification', notifObj);
      }
    } catch (err) {
      console.error('Error handling PAYMENT_SUCCESS event:', err);
    }
  });
}

export default {
  initNotificationEvents,
  setSocketIO
};
