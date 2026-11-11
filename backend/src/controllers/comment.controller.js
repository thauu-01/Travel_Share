import commentService from '../services/comment.service.js';
import ApiResponse from '../utils/apiResponse.js';

class CommentController {
  async getByPost(req, res, next) {
    try {
      const comments = await commentService.getCommentsByPost(req.params.postId);
      return ApiResponse.success(res, comments);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const comment = await commentService.createComment(req.params.postId, req.user.id, req.body);
      return ApiResponse.created(res, comment, 'Bình luận thành công');
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const commentId = req.params.commentId || req.params.id;
      const result = await commentService.deleteComment(commentId, req.user.id, req.user.role);
      return ApiResponse.success(res, null, result.message);
    } catch (err) {
      next(err);
    }
  }
}

const controllerInstance = new CommentController();
export { controllerInstance as CommentController };
export default controllerInstance;
