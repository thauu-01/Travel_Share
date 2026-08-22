const { Comment, User, Post, Notification } = require('../models');

class CommentController {
  // GET /api/posts/:postId/comments
  async getByPost(req, res) {
    try {
      const { postId } = req.params;
      const comments = await Comment.find({ post_id: parseInt(postId), parent_id: null })
        .populate('user', 'id full_name avatar_url')
        .populate({
          path: 'replies',
          populate: { path: 'user', select: 'id full_name avatar_url' },
          options: { sort: { created_at: 1 } }
        })
        .sort({ created_at: -1 });

      res.json({ success: true, data: comments });
    } catch (error) {
      console.error('GetComments error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // POST /api/posts/:postId/comments
  async create(req, res) {
    try {
      const { postId } = req.params;
      const { content, parent_id } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({ success: false, message: 'Nội dung bình luận không được để trống' });
      }

      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
      }

      const comment = await Comment.create({
        content: content.trim(),
        user_id: req.user.id,
        post_id: parseInt(postId),
        parent_id: parent_id ? parseInt(parent_id) : null
      });

      const fullComment = await Comment.findById(comment.id)
        .populate('user', 'id full_name avatar_url');

      // Create notification
      const fromUser = await User.findById(req.user.id).select('id full_name avatar_url');
      const io = req.app.get('io');

      if (parent_id) {
        // Reply notification to parent comment author
        const parentComment = await Comment.findById(parent_id);
        if (parentComment && parentComment.user_id !== req.user.id) {
          const notification = await Notification.create({
            user_id: parentComment.user_id,
            from_user_id: req.user.id,
            type: 'reply',
            post_id: parseInt(postId),
            message: `${fromUser?.full_name || 'Ai đó'} đã trả lời bình luận của bạn`
          });
          if (io) {
            const notifObj = notification.toObject ? notification.toObject() : { ...notification._doc };
            notifObj.fromUser = fromUser;
            io.to(`user_${parentComment.user_id}`).emit('notification', notifObj);
          }
        }
      } else if (post.user_id !== req.user.id) {
        // Comment notification to post author
        const notification = await Notification.create({
          user_id: post.user_id,
          from_user_id: req.user.id,
          type: 'comment',
          post_id: parseInt(postId),
          message: `${fromUser?.full_name || 'Ai đó'} đã bình luận bài viết của bạn`
        });
        if (io) {
          const notifObj = notification.toObject ? notification.toObject() : { ...notification._doc };
          notifObj.fromUser = fromUser;
          io.to(`user_${post.user_id}`).emit('notification', notifObj);
        }
      }

      res.status(201).json({ success: true, message: 'Bình luận thành công', data: fullComment });
    } catch (error) {
      console.error('CreateComment error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // DELETE /api/posts/:postId/comments/:commentId
  async delete(req, res) {
    try {
      const comment = await Comment.findById(req.params.commentId);
      if (!comment) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận' });
      }
      if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa bình luận này' });
      }

      await comment.deleteOne();
      res.json({ success: true, message: 'Xóa bình luận thành công' });
    } catch (error) {
      console.error('DeleteComment error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }
}

module.exports = new CommentController();
