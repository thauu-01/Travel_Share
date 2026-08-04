const bcrypt = require('bcryptjs');
const { User, Post, PostImage, Like, Place, Category } = require('../models');

class UserController {
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.params.id).select('-password');
      if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
      const postCount = await Post.countDocuments({ user_id: user.id, status: 'published' });
      const likeCount = await Like.countDocuments({ user_id: user.id });
      res.json({ success: true, data: { ...user.toJSON(), postCount, likeCount } });
    } catch (error) {
      console.error('GetProfile error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  async updateProfile(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
      const { full_name, bio } = req.body;
      
      if (full_name) user.full_name = full_name;
      if (bio !== undefined) user.bio = bio;
      if (req.file) user.avatar_url = req.file.path;
      
      await user.save();
      res.json({
        success: true,
        message: 'Cập nhật thành công',
        data: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          bio: user.bio,
          role: user.role
        }
      });
    } catch (error) {
      console.error('UpdateProfile error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  async getUserPosts(req, res) {
    try {
      const isOwnerOrAdmin = req.user && (String(req.params.id) === String(req.user.id) || req.user.role === 'admin');
      const query = { user_id: req.params.id };
      if (!isOwnerOrAdmin) {
        query.status = 'published';
      }

      const posts = await Post.find(query)
        .populate('author', 'id full_name avatar_url')
        .populate({
          path: 'place',
          select: 'id name province category_id',
          populate: { path: 'category', select: 'id name icon' }
        })
        .populate('images', 'id image_url is_cover')
        .populate('likes', 'user_id')
        .sort({ created_at: -1 });
      res.json({ success: true, data: posts });
    } catch (error) {
      console.error('GetUserPosts error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  async getLikedPosts(req, res) {
    try {
      const likes = await Like.find({ user_id: req.user.id })
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
      res.json({ success: true, data: likes.map(l => l.post).filter(Boolean) });
    } catch (error) {
      console.error('GetLikedPosts error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }
}

module.exports = new UserController();
