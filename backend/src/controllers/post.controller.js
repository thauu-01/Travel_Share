import postService from '../services/post.service.js';
import ApiResponse from '../utils/apiResponse.js';

class PostController {
  async getAll(req, res, next) {
    try {
      const result = await postService.getAllPosts(req.query);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getTrending(req, res, next) {
    try {
      const posts = await postService.getTrendingPosts();
      return ApiResponse.success(res, posts);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const post = await postService.getPostById(req.params.id, req.user?.id);
      return ApiResponse.success(res, post);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const post = await postService.createPost(req.user.id, req.body, req.files);
      return ApiResponse.created(res, post, 'Tạo bài viết thành công');
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const post = await postService.updatePost(
        req.params.id,
        req.user.id,
        req.user.role,
        req.body,
        req.files
      );
      return ApiResponse.success(res, post, 'Cập nhật bài viết thành công');
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await postService.deletePost(req.params.id, req.user.id, req.user.role);
      return ApiResponse.success(res, null, result.message);
    } catch (err) {
      next(err);
    }
  }

  async toggleLike(req, res, next) {
    try {
      const result = await postService.toggleLike(req.params.id, req.user);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }
}

const controllerInstance = new PostController();
export { controllerInstance as PostController };
export default controllerInstance;
