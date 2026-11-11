import postRepository from '../repositories/post.repository.js';
import placeRepository from '../repositories/place.repository.js';
import tripRepository from '../repositories/trip.repository.js';
import appEventEmitter from '../events/eventEmitter.js';
import eventTypes from '../events/eventTypes.js';
import ApiError from '../utils/apiError.js';

export class PostService {
  async getAllPosts(queryParams) {
    return await postRepository.getPostsWithFilter(queryParams);
  }

  async getPostById(postId, currentUserId = null) {
    const post = await postRepository.getPostByIdWithDetails(postId);
    if (!post) {
      throw ApiError.notFound('Không tìm thấy bài viết');
    }

    if (post.status !== 'published') {
      const isOwner = currentUserId && String(post.user_id) === String(currentUserId);
      if (!isOwner) {
        throw ApiError.forbidden('Bài viết này đang ở chế độ riêng tư hoặc chưa được duyệt');
      }
    }

    postRepository.incrementViews(postId, currentUserId).catch(err => {
      console.error('Error incrementing post views:', err);
    });

    return post;
  }

  async getTrendingPosts() {
    return await postRepository.getTopViewedPosts(6);
  }

  async createPost(userId, { title, content, rating, place_id, trip_id }, files = []) {
    if (place_id) {
      const placeExists = await placeRepository.exists({ _id: place_id });
      if (!placeExists) throw ApiError.badRequest('Địa điểm không tồn tại');
    }

    if (trip_id) {
      const trip = await tripRepository.findById(trip_id);
      if (!trip) throw ApiError.badRequest('Lịch trình không tồn tại');
      if (String(trip.user_id) !== String(userId)) {
        throw ApiError.forbidden('Bạn không có quyền đính kèm lịch trình này');
      }
    }

    const post = await postRepository.create({
      title: title.trim(),
      content: content.trim(),
      rating: rating ? parseInt(rating) : 5,
      place_id: place_id ? parseInt(place_id) : null,
      trip_id: trip_id ? parseInt(trip_id) : null,
      user_id: userId,
      status: 'published'
    });

    if (files && files.length > 0) {
      const imagesData = files.map((file, index) => ({
        post_id: post.id || post._id,
        image_url: file.path,
        is_cover: index === 0
      }));
      await postRepository.createPostImages(imagesData);
    }

    return await postRepository.getPostByIdWithDetails(post.id || post._id);
  }

  async updatePost(postId, userId, userRole, { title, content, rating, place_id, trip_id }, files = []) {
    const post = await postRepository.findById(postId);
    if (!post) throw ApiError.notFound('Không tìm thấy bài viết');

    if (String(post.user_id) !== String(userId) && userRole !== 'admin') {
      throw ApiError.forbidden('Bạn không có quyền sửa bài viết này');
    }

    if (title) post.title = title.trim();
    if (content) post.content = content.trim();
    if (rating) post.rating = parseInt(rating);
    if (place_id !== undefined) post.place_id = place_id ? parseInt(place_id) : null;
    if (trip_id !== undefined) post.trip_id = trip_id ? parseInt(trip_id) : null;

    await post.save();

    if (files && files.length > 0) {
      await postRepository.deletePostImages(post.id || post._id);
      const imagesData = files.map((file, index) => ({
        post_id: post.id || post._id,
        image_url: file.path,
        is_cover: index === 0
      }));
      await postRepository.createPostImages(imagesData);
    }

    return await postRepository.getPostByIdWithDetails(post.id || post._id);
  }

  async deletePost(postId, userId, userRole) {
    const post = await postRepository.findById(postId);
    if (!post) throw ApiError.notFound('Không tìm thấy bài viết');

    if (String(post.user_id) !== String(userId) && userRole !== 'admin') {
      throw ApiError.forbidden('Bạn không có quyền xóa bài viết này');
    }

    await postRepository.deletePostImages(postId);
    await post.deleteOne();
    return { message: 'Xóa bài viết thành công' };
  }

  async toggleLike(postId, user) {
    const post = await postRepository.findById(postId);
    if (!post) throw ApiError.notFound('Không tìm thấy bài viết');

    const result = await postRepository.toggleLike(postId, user.id);

    if (result.liked) {
      appEventEmitter.emit(eventTypes.POST_LIKED, {
        post,
        fromUser: user
      });
    }

    return result;
  }
}

export const postService = new PostService();
export default postService;
