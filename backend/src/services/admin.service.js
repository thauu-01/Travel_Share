import userRepository from '../repositories/user.repository.js';
import postRepository from '../repositories/post.repository.js';
import placeRepository from '../repositories/place.repository.js';
import reportRepository from '../repositories/report.repository.js';
import paymentRepository from '../repositories/payment.repository.js';
import chatRepository from '../repositories/chat.repository.js';
import { User, Post, Place, Report, ChatMessage, Comment, Notification, Payment } from '../models/index.js';
import { slugify } from '../utils/slug.util.js';
import ApiError from '../utils/apiError.js';

class AdminService {
  async getDashboardData() {
    const totalUsers = await User.countDocuments();
    const totalPosts = await Post.countDocuments();
    const totalPlaces = await Place.countDocuments();
    const totalReports = await Report.countDocuments({ status: 'pending' });

    const topPosts = await Post.find()
      .populate('author', 'id full_name avatar_url')
      .populate('likes', 'id')
      .populate('comments', 'id')
      .sort({ view_count: -1 })
      .limit(5);

    const topPlaces = await Place.find()
      .populate('category', 'id name icon')
      .sort({ avg_rating: -1 })
      .limit(5);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsers = await User.find({ created_at: { $gte: sevenDaysAgo } }).select('created_at');

    return {
      totalUsers,
      totalPosts,
      totalPlaces,
      totalReports,
      topPosts,
      topPlaces,
      newUsers
    };
  }

  async getUsers(queryParams) {
    return await userRepository.getUsersList(queryParams);
  }

  async banUser(targetUserId, currentAdminId) {
    if (String(targetUserId) === String(currentAdminId)) {
      throw ApiError.badRequest('Bạn không thể tự khóa tài khoản của chính mình');
    }
    const user = await userRepository.findById(targetUserId);
    if (!user) throw ApiError.notFound('Không tìm thấy người dùng');

    user.is_active = false;
    await user.save();
    return { message: 'Đã khóa tài khoản người dùng' };
  }

  async unbanUser(targetUserId) {
    const user = await userRepository.findById(targetUserId);
    if (!user) throw ApiError.notFound('Không tìm thấy người dùng');

    user.is_active = true;
    await user.save();
    return { message: 'Đã mở khóa tài khoản người dùng' };
  }

  async changeUserRole(targetUserId, newRole, currentAdminId) {
    if (String(targetUserId) === String(currentAdminId)) {
      throw ApiError.badRequest('Bạn không thể tự thay đổi vai trò của chính mình');
    }
    const user = await userRepository.findById(targetUserId);
    if (!user) throw ApiError.notFound('Không tìm thấy người dùng');

    user.role = newRole;
    await user.save();
    return { message: `Đã đổi vai trò thành ${newRole}` };
  }

  async deleteUser(targetUserId, currentAdminId) {
    if (String(targetUserId) === String(currentAdminId)) {
      throw ApiError.badRequest('Bạn không thể tự xóa tài khoản của chính mình');
    }
    const user = await userRepository.findById(targetUserId);
    if (!user) throw ApiError.notFound('Không tìm thấy người dùng');

    await user.deleteOne();
    return { message: 'Đã xóa người dùng thành công' };
  }

  async getAdminPosts({ page = 1, limit = 20, status, search }) {
    const limitNum = parseInt(limit);
    const skipNum = (parseInt(page) - 1) * limitNum;

    const where = {};
    if (status) where.status = status;
    if (search) where.title = { $regex: search, $options: 'i' };

    const total = await Post.countDocuments(where);
    const posts = await Post.find(where)
      .populate('author', 'id full_name email avatar_url')
      .populate('place', 'id name province')
      .sort({ created_at: -1 })
      .limit(limitNum)
      .skip(skipNum);

    return {
      posts,
      pagination: {
        total,
        page: parseInt(page),
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  }

  async togglePostVisibility(postId) {
    const post = await postRepository.findById(postId);
    if (!post) throw ApiError.notFound('Không tìm thấy bài viết');

    post.status = post.status === 'published' ? 'hidden' : 'published';
    await post.save();
    return { message: `Đã chuyển trạng thái bài viết thành ${post.status}`, post };
  }

  async deletePost(postId) {
    return await postRepository.deletePostImages(postId).then(async () => {
      await Post.findByIdAndDelete(postId);
      return { message: 'Xóa bài viết thành công' };
    });
  }

  // Transactions management for Admin
  async getTransactions(queryParams = {}) {
    const { page = 1, limit = 12, status, search } = queryParams;
    const limitNum = parseInt(limit) || 12;
    const skipNum = (parseInt(page) - 1) * limitNum;

    const where = {};
    if (status) where.status = status;

    if (search) {
      const matchUsers = await User.find({
        $or: [
          { email: new RegExp(search, 'i') },
          { full_name: new RegExp(search, 'i') }
        ]
      }).select('_id');
      where.user_id = { $in: matchUsers.map(u => u._id) };
    }

    const total = await Payment.countDocuments(where);
    const payments = await Payment.find(where)
      .populate('user_id', 'id full_name email avatar_url')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skipNum)
      .lean();

    const result = payments.map(p => ({
      ...p,
      user: p.user_id
    }));

    const stats = await Payment.aggregate([
      { $match: { status: 'success' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalCredits: { $sum: '$credits_purchased' },
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    return {
      payments: result,
      pagination: {
        total,
        page: parseInt(page) || 1,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1
      },
      stats: stats[0] || { totalRevenue: 0, totalCredits: 0, totalOrders: 0 }
    };
  }

  // Broadcast notification to all active users
  async broadcastNotification(adminId, title, message, io = null) {
    if (!title || !message) {
      throw ApiError.badRequest('Tiêu đề và nội dung là bắt buộc');
    }
    const users = await User.find({ is_active: true }).select('_id');
    const fullMessage = `${title}: ${message}`;
    const senderAdmin = await User.findById(adminId).select('id full_name avatar_url');

    for (const targetUser of users) {
      const notif = await Notification.create({
        user_id: targetUser._id,
        from_user_id: adminId,
        type: 'system',
        message: fullMessage
      });

      if (io) {
        const notifObj = notif.toObject ? notif.toObject() : { ...notif._doc };
        notifObj.fromUser = senderAdmin;
        io.to(`user_${targetUser._id}`).emit('notification', notifObj);
      }
    }

    return { message: 'Đã phát sóng thông báo hệ thống đến tất cả người dùng hoạt động' };
  }

  // Support Chat Threads
  async getSupportConversations() {
    const usersWithChats = await ChatMessage.aggregate([
      { $group: { _id: '$user_id', lastMsgTime: { $max: '$created_at' } } },
      { $sort: { lastMsgTime: -1 } }
    ]);

    const chats = await Promise.all(usersWithChats.map(async (chat) => {
      const userId = chat._id;
      const user = await User.findById(userId).select('id full_name avatar_url email');
      const lastMessage = await ChatMessage.findOne({ user_id: userId }).sort({ created_at: -1 });
      const unreadCount = await ChatMessage.countDocuments({ user_id: userId, sender_type: 'user', is_read_by_admin: false });

      return {
        user,
        lastMessage,
        unreadCount
      };
    }));

    return chats;
  }

  // Get chat history with specific user
  async getSupportMessages(userId) {
    const uid = parseInt(userId);
    const messages = await ChatMessage.find({ user_id: uid }).sort({ created_at: 1 });
    await ChatMessage.updateMany({ user_id: uid, sender_type: 'user' }, { is_read_by_admin: true });
    return messages;
  }

  // Send admin message
  async sendSupportReply(targetUserId, adminId, message, io = null) {
    const uid = parseInt(targetUserId);
    if (!message || !message.trim()) {
      throw ApiError.badRequest('Nội dung tin nhắn trống');
    }

    const chatMessage = await ChatMessage.create({
      user_id: uid,
      sender_type: 'admin',
      message: message.trim()
    });

    if (io) {
      io.to(`user_${uid}`).emit('new_admin_message', chatMessage);
      io.to('admin_support').emit('new_user_message', {
        userId: uid,
        message: chatMessage
      });
    }

    return chatMessage;
  }

  // Comments management for Admin
  async getComments(queryParams = {}) {
    const { page = 1, limit = 20, search } = queryParams;
    const limitNum = parseInt(limit) || 20;
    const skipNum = (parseInt(page) - 1) * limitNum;

    const where = {};
    if (search) {
      where.content = { $regex: search, $options: 'i' };
    }

    const count = await Comment.countDocuments(where);
    const comments = await Comment.find(where)
      .populate('user', 'id full_name avatar_url')
      .populate('post', 'id title')
      .sort({ created_at: -1 })
      .limit(limitNum)
      .skip(skipNum);

    return {
      comments,
      pagination: {
        total: count,
        page: parseInt(page) || 1,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum) || 1
      }
    };
  }

  async deleteComment(commentId) {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw ApiError.notFound('Không tìm thấy bình luận');
    }
    await Comment.deleteMany({ parent_id: comment._id });
    await comment.deleteOne();
    return { message: 'Xóa bình luận thành công' };
  }

  // Places management for Admin
  async getPlaces(queryParams = {}) {
    const { search } = queryParams;
    const where = {};
    if (search) {
      where.$or = [
        { name: { $regex: search, $options: 'i' } },
        { province: { $regex: search, $options: 'i' } }
      ];
    }
    const places = await Place.find(where)
      .populate('category', 'id name icon')
      .sort({ name: 1 });
    return places;
  }
}

const serviceInstance = new AdminService();
export { serviceInstance as AdminService };
export default serviceInstance;
