const { Post, User, Place, PostImage, Comment, Like, ViewHistory, Category, Notification } = require('../models');

class PostController {
  // GET /api/posts
  async getAll(req, res) {
    try {
      const { page = 1, limit = 12, category, province, rating, sort = 'newest', search } = req.query;
      const limitNum = parseInt(limit);
      const skipNum = (parseInt(page) - 1) * limitNum;

      const where = { status: 'published' };

      // Handle category and province filters via places
      if (category || province) {
        const placeWhere = {};
        if (category) placeWhere.category_id = parseInt(category);
        if (province) placeWhere.province = province;

        const matchingPlaces = await Place.find(placeWhere).select('_id');
        const placeIds = matchingPlaces.map(p => p._id);
        where.place_id = { $in: placeIds };
      }

      if (rating) {
        where.rating = { $gte: parseInt(rating) };
      }

      if (search) {
        const keywords = search.split(/\s+/).filter(k => k.trim());
        if (keywords.length > 0) {
          where.$and = keywords.map(kw => ({
            $or: [
              { title: { $regex: kw, $options: 'i' } },
              { content: { $regex: kw, $options: 'i' } }
            ]
          }));
        }
      }

      let sortObj = { created_at: -1 };
      if (sort === 'popular') sortObj = { view_count: -1 };
      if (sort === 'rating') sortObj = { rating: -1 };

      const count = await Post.countDocuments(where);
      const rows = await Post.find(where)
        .populate('author', 'id full_name avatar_url')
        .populate({
          path: 'place',
          select: 'id name province latitude longitude slug category_id',
          populate: { path: 'category', select: 'id name slug icon' }
        })
        .populate('images', 'id image_url is_cover')
        .populate('likes', 'user_id')
        .sort(sortObj)
        .limit(limitNum)
        .skip(skipNum);

      res.json({
        success: true,
        data: {
          posts: rows,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: limitNum,
            totalPages: Math.ceil(count / limitNum)
          }
        }
      });
    } catch (error) {
      console.error('GetAll posts error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // GET /api/posts/trending
  async getTrending(req, res) {
    try {
      const posts = await Post.find({
        status: 'published'
      })
        .populate('author', 'id full_name avatar_url')
        .populate({
          path: 'place',
          select: 'id name province slug',
          populate: { path: 'category', select: 'id name icon' }
        })
        .populate('images', 'id image_url is_cover')
        .populate('likes', 'user_id')
        .populate('comments', 'id')
        .sort({ view_count: -1 })
        .limit(10);

      // Sort by engagement score: views + likes*3 + comments*2
      const scored = posts.map(p => {
        const post = p.toJSON();
        post.score = post.view_count + (post.likes?.length || 0) * 3 + (post.comments?.length || 0) * 2;
        return post;
      }).sort((a, b) => b.score - a.score);

      res.json({ success: true, data: scored });
    } catch (error) {
      console.error('GetTrending error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // GET /api/posts/:id
  async getById(req, res) {
    try {
      const post = await Post.findById(req.params.id)
        .populate('author', 'id full_name avatar_url bio')
        .populate({
          path: 'place',
          populate: { path: 'category' }
        })
        .populate('images')
        .populate('likes', 'user_id')
        .populate({
          path: 'comments',
          match: { parent_id: null },
          populate: [
            { path: 'user', select: 'id full_name avatar_url' },
            {
              path: 'replies',
              populate: { path: 'user', select: 'id full_name avatar_url' }
            }
          ],
          options: { sort: { created_at: 1 } }
        });

      if (!post) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
      }

      // Increment view count
      post.view_count = (post.view_count || 0) + 1;
      await post.save();

      // Track view history if user is logged in
      if (req.user) {
        await ViewHistory.create({ user_id: req.user.id, post_id: post.id }).catch(() => {});
      }

      res.json({ success: true, data: post });
    } catch (error) {
      console.error('GetById post error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // POST /api/posts
  async create(req, res) {
    try {
      const { title, content, place_id, rating } = req.body;

      if (!title || !content) {
        return res.status(400).json({
          success: false,
          message: 'Tiêu đề và nội dung không được để trống'
        });
      }

      const post = await Post.create({
        title,
        content,
        user_id: req.user.id,
        place_id: place_id ? parseInt(place_id) : null,
        rating: rating ? parseInt(rating) : null
      });

      // Handle uploaded images
      if (req.files && req.files.length > 0) {
        console.log('📸 Uploaded files:', req.files.map(f => ({ 
          filename: f.filename, 
          path: f.path,
          secure_url: f.secure_url 
        })));
        const images = req.files.map((file, index) => ({
          post_id: post.id,
          image_url: file.path,
          is_cover: index === 0
        }));
        await PostImage.insertMany(images);
      } else {
        console.log('⚠️ No files uploaded - req.files:', req.files);
      }

      // Update place avg_rating if place_id and rating provided
      if (place_id && rating) {
        const ratings = await Post.find({ place_id: parseInt(place_id), rating: { $ne: null } }).select('rating');
        if (ratings.length > 0) {
          const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0);
          const avgRating = sum / ratings.length;
          await Place.findByIdAndUpdate(parseInt(place_id), { avg_rating: avgRating });
        }
      }

      const fullPost = await Post.findById(post.id)
        .populate('author', 'id full_name avatar_url')
        .populate('place')
        .populate('images');

      res.status(201).json({
        success: true,
        message: 'Tạo bài viết thành công',
        data: fullPost
      });
    } catch (error) {
      console.error('Create post error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // PUT /api/posts/:id
  async update(req, res) {
    try {
      const post = await Post.findById(req.params.id);
      if (!post) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
      }
      if (String(post.user_id) !== String(req.user.id) && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền sửa bài viết này' });
      }

      const { title, content, place_id, rating, status } = req.body;
      
      if (title !== undefined) post.title = title;
      if (content !== undefined) post.content = content;
      if (place_id !== undefined) post.place_id = place_id ? parseInt(place_id) : null;
      if (rating !== undefined) post.rating = rating ? parseInt(rating) : null;
      if (status !== undefined) post.status = status;

      await post.save();

      const PostImage = require('../models/PostImage');
      
      if (req.body.images_to_remove) {
        let removeIds = req.body.images_to_remove;
        if (!Array.isArray(removeIds)) removeIds = [removeIds];
        await PostImage.deleteMany({ _id: { $in: removeIds }, post_id: post.id });
      }

      if (req.files && req.files.length > 0) {
        const images = req.files.map((file) => ({
          post_id: post.id,
          image_url: file.path,
          is_cover: false
        }));
        await PostImage.insertMany(images);
      }

      res.json({ success: true, message: 'Cập nhật bài viết thành công', data: post });
    } catch (error) {
      console.error('Update post error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // DELETE /api/posts/:id
  async delete(req, res) {
    try {
      const post = await Post.findById(req.params.id);
      if (!post) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
      }
      if (post.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa bài viết này' });
      }

      await post.deleteOne();
      res.json({ success: true, message: 'Xóa bài viết thành công' });
    } catch (error) {
      console.error('Delete post error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // POST /api/posts/:id/like
  async toggleLike(req, res) {
    try {
      const postId = parseInt(req.params.id);
      const userId = req.user.id;

      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
      }

      const existingLike = await Like.findOne({ user_id: userId, post_id: postId });

      if (existingLike) {
        await existingLike.deleteOne();
        res.json({ success: true, message: 'Đã bỏ like', data: { liked: false } });
      } else {
        await Like.create({ user_id: userId, post_id: postId });

        // Create notification if liker is not the post owner
        if (post.user_id !== userId) {
          const fromUser = await User.findById(userId).select('full_name');
          const notification = await Notification.create({
            user_id: post.user_id,
            from_user_id: userId,
            type: 'like',
            post_id: postId,
            message: `${fromUser.full_name} đã thích bài viết của bạn`
          });

          // Emit real-time notification
          const io = req.app.get('io');
          if (io) {
            io.to(`user_${post.user_id}`).emit('notification', notification);
          }
        }

        res.json({ success: true, message: 'Đã like', data: { liked: true } });
      }
    } catch (error) {
      console.error('ToggleLike error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }
}

module.exports = new PostController();
