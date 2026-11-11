import userRepository from '../repositories/user.repository.js';
import postRepository from '../repositories/post.repository.js';
import placeRepository from '../repositories/place.repository.js';
import reportRepository from '../repositories/report.repository.js';
import paymentRepository from '../repositories/payment.repository.js';
import chatRepository from '../repositories/chat.repository.js';
import { User, Post, Place, Report, ChatMessage } from '../models/index.js';
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

  async getTransactions(queryParams) {
    return await paymentRepository.getAllPaymentsWithUsers(queryParams);
  }

  async getSupportConversations() {
    return await chatRepository.getSupportConversations();
  }

  async getSupportMessages(userId) {
    return await chatRepository.getUserMessages(userId);
  }

  async sendSupportReply(targetUserId, adminId, message, io = null) {
    const msg = await chatRepository.create({
      user_id: targetUserId,
      sender: 'admin',
      message: message.trim(),
      is_support: true
    });

    if (io) {
      io.to(`user_${targetUserId}`).emit('support_reply', msg);
    }

    return msg;
  }
}

const serviceInstance = new AdminService();
export { serviceInstance as AdminService };
export default serviceInstance;
