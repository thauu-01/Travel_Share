const { User, Post, Place, Comment, Like, PostImage, Category, Notification, Report, ChatMessage } = require('../models');

class AdminController {
  // GET /api/admin/dashboard
  async getDashboard(req, res) {
    try {
      const totalUsers = await User.countDocuments();
      const totalPosts = await Post.countDocuments();
      const totalPlaces = await Place.countDocuments();
      const totalReports = await Report.countDocuments({ status: 'pending' });

      // Top 5 posts by views
      const topPosts = await Post.find()
        .populate('author', 'id full_name avatar_url')
        .populate('likes', 'id')
        .populate('comments', 'id')
        .sort({ view_count: -1 })
        .limit(5);

      // Top 5 places by rating
      const topPlaces = await Place.find()
        .populate('category', 'id name icon')
        .sort({ avg_rating: -1 })
        .limit(5);

      // Simple new users stats (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const newUsers = await User.find({ created_at: { $gte: sevenDaysAgo } }).select('created_at');

      res.json({
        success: true,
        data: {
          totalUsers,
          totalPosts,
          totalPlaces,
          totalReports,
          topPosts,
          topPlaces,
          newUsers
        }
      });
    } catch (error) {
      console.error('Admin getDashboard error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // GET /api/admin/users
  async getUsers(req, res) {
    try {
      const { search, status, role, page = 1, limit = 20 } = req.query;
      const limitNum = parseInt(limit);
      const skipNum = (parseInt(page) - 1) * limitNum;

      const where = {};
      if (status === 'active') where.is_active = true;
      if (status === 'banned') where.is_active = false;
      if (role) where.role = role;

      if (search) {
        where.$or = [
          { full_name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const count = await User.countDocuments(where);
      const users = await User.find(where)
        .sort({ created_at: -1 })
        .limit(limitNum)
        .skip(skipNum);

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: limitNum,
            totalPages: Math.ceil(count / limitNum)
          }
        }
      });
    } catch (error) {
      console.error('Admin getUsers error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // PATCH /api/admin/users/:id/ban
  async banUser(req, res) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
      }

      if (String(user._id) === String(req.user.id)) {
        return res.status(400).json({ success: false, message: 'Bạn không thể tự khóa tài khoản của chính mình' });
      }

      user.is_active = !user.is_active;
      await user.save();

      res.json({
        success: true,
        message: user.is_active ? 'Đã mở khóa tài khoản thành công' : 'Đã khóa tài khoản thành công',
        data: user
      });
    } catch (error) {
      console.error('Admin banUser error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // PATCH /api/admin/users/:id/role
  async updateUserRole(req, res) {
    try {
      const { role } = req.body;
      if (!role || !['user', 'admin'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Quyền không hợp lệ' });
      }

      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
      }

      if (String(user._id) === String(req.user.id)) {
        return res.status(400).json({ success: false, message: 'Bạn không thể tự hạ quyền hoặc thay đổi quyền của chính mình' });
      }

      user.role = role;
      await user.save();

      res.json({ success: true, message: 'Cập nhật phân quyền thành công', data: user });
    } catch (error) {
      console.error('Admin updateUserRole error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // GET /api/admin/posts
  async getPosts(req, res) {
    try {
      const { page = 1, limit = 20, search, status } = req.query;
      const limitNum = parseInt(limit);
      const skipNum = (parseInt(page) - 1) * limitNum;

      const where = {};
      if (status) {
        where.status = status;
      }

      if (search) {
        where.$or = [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } }
        ];
      }

      const count = await Post.countDocuments(where);
      const posts = await Post.find(where)
        .populate('author', 'id full_name avatar_url')
        .populate('place', 'id name province')
        .populate('images')
        .populate('likes', 'user_id')
        .sort({ created_at: -1 })
        .limit(limitNum)
        .skip(skipNum);

      res.json({
        success: true,
        data: {
          posts,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: limitNum,
            totalPages: Math.ceil(count / limitNum)
          }
        }
      });
    } catch (error) {
      console.error('Admin getPosts error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // PATCH /api/admin/posts/:id/visibility
  async togglePostVisibility(req, res) {
    try {
      const post = await Post.findById(req.params.id);
      if (!post) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
      }

      post.is_hidden = !post.is_hidden;
      post.status = post.is_hidden ? 'hidden' : 'published';
      await post.save();

      // If Admin hid the post, send system notification to author
      if (post.is_hidden && post.user_id) {
        const { getNextSequenceValue } = require('../models/counter');
        const notifId = await getNextSequenceValue('notifications');
        const notification = await Notification.create({
          _id: notifId,
          user_id: post.user_id,
          from_user_id: req.user.id,
          type: 'system',
          post_id: post.id || post._id,
          message: `Bài viết "${post.title || 'bài viết của bạn'}" đã bị Quản trị viên ẩn khỏi Newsfeed do vi phạm tiêu chuẩn cộng đồng.`
        });

        const io = req.app.get('io');
        if (io) {
          io.to(`user_${post.user_id}`).emit('notification', notification);
        }
      }

      res.json({
        success: true,
        message: post.is_hidden ? 'Đã ẩn bài viết thành công và gửi thông báo tới tác giả' : 'Đã hiện bài viết thành công',
        data: post
      });
    } catch (error) {
      console.error('Admin togglePostVisibility error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // DELETE /api/admin/posts/:id
  async deletePost(req, res) {
    try {
      const post = await Post.findById(req.params.id);
      if (!post) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
      }

      // Notify the author before deletion
      if (post.user_id) {
        const { getNextSequenceValue } = require('../models/counter');
        const notifId = await getNextSequenceValue('notifications');
        const notification = await Notification.create({
          _id: notifId,
          user_id: post.user_id,
          from_user_id: req.user.id,
          type: 'system',
          message: `Bài viết "${post.title || 'bài viết của bạn'}" đã bị Quản trị viên xóa khỏi hệ thống do vi phạm tiêu chuẩn cộng đồng.`
        });

        const io = req.app.get('io');
        if (io) {
          io.to(`user_${post.user_id}`).emit('notification', notification);
        }
      }

      // Cleanup related entities
      await PostImage.deleteMany({ post_id: post._id });
      await Comment.deleteMany({ post_id: post._id });
      await Like.deleteMany({ post_id: post._id });
      await post.deleteOne();

      res.json({ success: true, message: 'Xóa bài viết thành công và đã gửi thông báo tới tác giả' });
    } catch (error) {
      console.error('Admin deletePost error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // GET /api/admin/comments
  async getComments(req, res) {
    try {
      const { page = 1, limit = 20, search } = req.query;
      const limitNum = parseInt(limit);
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

      res.json({
        success: true,
        data: {
          comments,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: limitNum,
            totalPages: Math.ceil(count / limitNum)
          }
        }
      });
    } catch (error) {
      console.error('Admin getComments error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // DELETE /api/admin/comments/:id
  async deleteComment(req, res) {
    try {
      const comment = await Comment.findById(req.params.id);
      if (!comment) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận' });
      }

      // Delete replies if any
      await Comment.deleteMany({ parent_id: comment._id });
      await comment.deleteOne();

      res.json({ success: true, message: 'Xóa bình luận thành công' });
    } catch (error) {
      console.error('Admin deleteComment error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // GET /api/admin/places
  async getPlaces(req, res) {
    try {
      const { search } = req.query;
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

      res.json({ success: true, data: places });
    } catch (error) {
      console.error('Admin getPlaces error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // POST /api/admin/places
  async createPlace(req, res) {
    try {
      const { name, province, address, latitude, longitude, category_id, description } = req.body;
      if (!name || !province || !latitude || !longitude || !category_id) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin bắt buộc' });
      }

      const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      const place = await Place.create({
        name,
        slug,
        province,
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        category_id: parseInt(category_id),
        description,
        user_id: req.user.id
      });

      const fullPlace = await Place.findById(place.id).populate('category');

      res.status(201).json({ success: true, message: 'Tạo địa điểm thành công', data: fullPlace });
    } catch (error) {
      console.error('Admin createPlace error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // PUT /api/admin/places/:id
  async updatePlace(req, res) {
    try {
      const { name, province, address, latitude, longitude, category_id, description } = req.body;
      const place = await Place.findById(req.params.id);
      if (!place) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy địa điểm' });
      }

      if (name) {
        place.name = name;
        place.slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      }
      if (province) place.province = province;
      if (address !== undefined) place.address = address;
      if (latitude) place.latitude = parseFloat(latitude);
      if (longitude) place.longitude = parseFloat(longitude);
      if (category_id) place.category_id = parseInt(category_id);
      if (description !== undefined) place.description = description;

      await place.save();
      const fullPlace = await Place.findById(place.id).populate('category');

      res.json({ success: true, message: 'Cập nhật địa điểm thành công', data: fullPlace });
    } catch (error) {
      console.error('Admin updatePlace error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // DELETE /api/admin/places/:id
  async deletePlace(req, res) {
    try {
      const place = await Place.findById(req.params.id);
      if (!place) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy địa điểm' });
      }

      // Check if place has posts
      const postsCount = await Post.countDocuments({ place_id: place._id });
      if (postsCount > 0) {
        return res.status(400).json({ success: false, message: `Địa điểm này đang có ${postsCount} bài viết liên kết, không thể xóa` });
      }

      await place.deleteOne();
      res.json({ success: true, message: 'Xóa địa điểm thành công' });
    } catch (error) {
      console.error('Admin deletePlace error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // GET /api/admin/categories
  async getCategories(req, res) {
    try {
      const categories = await Category.find().sort({ name: 1 });
      res.json({ success: true, data: categories });
    } catch (error) {
      console.error('Admin getCategories error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // POST /api/admin/categories
  async createCategory(req, res) {
    try {
      const { name, icon, slug } = req.body;
      if (!name || !icon) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập tên và icon danh mục' });
      }

      const generatedSlug = slug || name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      const category = await Category.create({
        name,
        icon,
        slug: generatedSlug
      });

      res.status(201).json({ success: true, message: 'Tạo danh mục thành công', data: category });
    } catch (error) {
      console.error('Admin createCategory error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // PUT /api/admin/categories/:id
  async updateCategory(req, res) {
    try {
      const { name, icon, slug } = req.body;
      const category = await Category.findById(req.params.id);
      if (!category) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
      }

      if (name) {
        category.name = name;
        category.slug = slug || name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      }
      if (icon) category.icon = icon;
      if (slug) category.slug = slug;

      await category.save();
      res.json({ success: true, message: 'Cập nhật danh mục thành công', data: category });
    } catch (error) {
      console.error('Admin updateCategory error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // DELETE /api/admin/categories/:id
  async deleteCategory(req, res) {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
      }

      // Check if category has places
      const placesCount = await Place.countDocuments({ category_id: category._id });
      if (placesCount > 0) {
        return res.status(400).json({ success: false, message: `Danh mục này đang chứa ${placesCount} địa điểm, không thể xóa` });
      }

      await category.deleteOne();
      res.json({ success: true, message: 'Xóa danh mục thành công' });
    } catch (error) {
      console.error('Admin deleteCategory error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // GET /api/admin/reports
  async getReports(req, res) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const limitNum = parseInt(limit);
      const skipNum = (parseInt(page) - 1) * limitNum;

      const where = {};
      if (status) where.status = status;

      const count = await Report.countDocuments(where);
      const reports = await Report.find(where)
        .populate('reporter', 'id full_name email')
        .sort({ created_at: -1 })
        .limit(limitNum)
        .skip(skipNum);

      // Populate targets manually because ref is dynamic
      const populatedReports = await Promise.all(reports.map(async (report) => {
        const item = report.toJSON();
        if (report.target_type === 'post') {
          item.target = await Post.findById(report.target_id).populate('author', 'full_name');
        } else if (report.target_type === 'comment') {
          item.target = await Comment.findById(report.target_id).populate('user', 'full_name');
        } else if (report.target_type === 'user') {
          item.target = await User.findById(report.target_id);
        }
        return item;
      }));

      res.json({
        success: true,
        data: {
          reports: populatedReports,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: limitNum,
            totalPages: Math.ceil(count / limitNum)
          }
        }
      });
    } catch (error) {
      console.error('Admin getReports error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // PATCH /api/admin/reports/:id
  async updateReport(req, res) {
    try {
      const { status, admin_note } = req.body;
      if (!status || !['resolved', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
      }

      const report = await Report.findById(req.params.id);
      if (!report) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy báo cáo' });
      }

      report.status = status;
      report.admin_note = admin_note || '';
      report.resolved_by = req.user.id;
      await report.save();

      res.json({ success: true, message: 'Cập nhật trạng thái báo cáo thành công', data: report });
    } catch (error) {
      console.error('Admin updateReport error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // POST /api/admin/notifications/broadcast
  async broadcastNotification(req, res) {
    try {
      const { title, message } = req.body;
      if (!title || !message) {
        return res.status(400).json({ success: false, message: 'Tiêu đề và nội dung là bắt buộc' });
      }

      const { getNextSequenceValue } = require('../models/counter');
      const users = await User.find({ is_active: true }).select('_id');
      const io = req.app.get('io');

      const fullMessage = `${title}: ${message}`;

      for (const targetUser of users) {
        const nextId = await getNextSequenceValue('notifications');
        const notif = await Notification.create({
          _id: nextId,
          user_id: targetUser._id,
          from_user_id: req.user.id,
          type: 'system',
          message: fullMessage
        });

        if (io) {
          io.to(`user_${targetUser._id}`).emit('notification', notif);
        }
      }

      if (io) {
        io.emit('system_notification', { title, message });
      }

      res.json({ success: true, message: 'Đã phát sóng thông báo hệ thống đến tất cả người dùng hoạt động' });
    } catch (error) {
      console.error('Admin broadcastNotification error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // GET /api/admin/chats
  async getSupportChats(req, res) {
    try {
      // Find all distinct users that have messages
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

      res.json({ success: true, data: chats });
    } catch (error) {
      console.error('Admin getSupportChats error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // GET /api/admin/chats/:userId
  async getChatHistory(req, res) {
    try {
      const userId = parseInt(req.params.userId);
      const messages = await ChatMessage.find({ user_id: userId }).sort({ created_at: 1 });

      // Mark all user messages as read by admin
      await ChatMessage.updateMany({ user_id: userId, sender_type: 'user' }, { is_read_by_admin: true });

      res.json({ success: true, data: messages });
    } catch (error) {
      console.error('Admin getChatHistory error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // POST /api/admin/chats/:userId/send
  async sendAdminMessage(req, res) {
    try {
      const userId = parseInt(req.params.userId);
      const { message } = req.body;
      if (!message || !message.trim()) {
        return res.status(400).json({ success: false, message: 'Nội dung tin nhắn trống' });
      }

      const chatMessage = await ChatMessage.create({
        user_id: userId,
        sender_type: 'admin',
        message: message.trim()
      });

      res.status(201).json({ success: true, data: chatMessage });
    } catch (error) {
      console.error('Admin sendAdminMessage error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }
}

module.exports = new AdminController();
