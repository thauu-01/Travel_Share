import userRepository from '../repositories/user.repository.js';
import { Post, Like } from '../models/index.js';
import ApiError from '../utils/apiError.js';

class UserService {
  async getProfile(userId) {
    const user = await userRepository.findByIdWithoutPassword(userId);
    if (!user) throw ApiError.notFound('Không tìm thấy người dùng');

    const postCount = await Post.countDocuments({ user_id: user.id || user._id, status: 'published' });
    const likeCount = await Like.countDocuments({ user_id: user.id || user._id });

    return {
      ...user.toJSON(),
      postCount,
      likeCount
    };
  }

  async updateProfile(userId, { full_name, bio }, file = null) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('Không tìm thấy người dùng');

    if (full_name) user.full_name = full_name.trim();
    if (bio !== undefined) user.bio = bio ? bio.trim() : '';
    if (file) user.avatar_url = file.path;

    await user.save();

    return {
      id: user.id || user._id,
      email: user.email,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      bio: user.bio,
      role: user.role
    };
  }

  async getUserPosts(targetUserId, currentUserId, currentUserRole) {
    const isOwnerOrAdmin = currentUserId && (String(targetUserId) === String(currentUserId) || currentUserRole === 'admin');
    const query = { user_id: targetUserId };
    if (!isOwnerOrAdmin) {
      query.status = 'published';
    }

    return await Post.find(query)
      .populate('author', 'id full_name avatar_url')
      .populate({
        path: 'place',
        select: 'id name province category_id',
        populate: { path: 'category', select: 'id name icon' }
      })
      .populate('images', 'id image_url is_cover')
      .populate('likes', 'user_id')
      .sort({ created_at: -1 });
  }

  async getLikedPosts(userId) {
    const likes = await Like.find({ user_id: userId })
      .populate({
        path: 'post',
        populate: [
          { path: 'author', select: 'id full_name avatar_url' },
          { path: 'place', select: 'id name province' },
          { path: 'images', select: 'id image_url is_cover' },
          { path: 'likes', select: 'user_id' }
        ]
      })
      .sort({ created_at: -1 });

    return likes.map(l => l.post).filter(Boolean);
  }
}

const serviceInstance = new UserService();
export { serviceInstance as UserService };
export default serviceInstance;
