import commentRepository from '../repositories/comment.repository.js';
import postRepository from '../repositories/post.repository.js';
import userRepository from '../repositories/user.repository.js';
import appEventEmitter from '../events/eventEmitter.js';
import eventTypes from '../events/eventTypes.js';
import ApiError from '../utils/apiError.js';

class CommentService {
  async getCommentsByPost(postId) {
    return await commentRepository.getCommentsByPostId(postId);
  }

  async createComment(postId, userId, { content, parent_id }) {
    const post = await postRepository.findById(postId);
    if (!post) throw ApiError.notFound('Không tìm thấy bài viết');

    const comment = await commentRepository.create({
      content: content.trim(),
      user_id: userId,
      post_id: parseInt(postId),
      parent_id: parent_id ? parseInt(parent_id) : null
    });

    const fullComment = await commentRepository.getCommentWithAuthor(comment.id || comment._id);
    const fromUser = await userRepository.findByIdWithoutPassword(userId);

    // Kích hoạt sự kiện tương ứng
    if (parent_id) {
      const parentComment = await commentRepository.findById(parent_id);
      if (parentComment) {
        appEventEmitter.emit(eventTypes.REPLY_CREATED, {
          parentComment,
          fromUser,
          postId: parseInt(postId)
        });
      }
    } else {
      appEventEmitter.emit(eventTypes.COMMENT_CREATED, {
        post,
        comment,
        fromUser
      });
    }

    return fullComment;
  }

  async deleteComment(commentId, userId, userRole) {
    const comment = await commentRepository.findById(commentId);
    if (!comment) throw ApiError.notFound('Không tìm thấy bình luận');

    if (String(comment.user_id) !== String(userId) && userRole !== 'admin') {
      throw ApiError.forbidden('Bạn không có quyền xóa bình luận này');
    }

    await comment.deleteOne();
    return { message: 'Xóa bình luận thành công' };
  }
}

const serviceInstance = new CommentService();
export { serviceInstance as CommentService };
export default serviceInstance;
