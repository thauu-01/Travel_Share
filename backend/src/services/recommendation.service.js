import { Post, Like, ViewHistory, Place } from '../models/index.js';

class RecommendationService {
  async getRecommendations(userId = null) {
    let recommendedPosts = [];
    let interactedPostIds = [];

    if (userId) {
      const likedPosts = await Like.find({ user_id: userId }).select('post_id');
      const viewedPosts = await ViewHistory.find({ user_id: userId })
        .select('post_id')
        .sort({ viewed_at: -1 })
        .limit(20);

      interactedPostIds = [...new Set([
        ...likedPosts.map(l => l.post_id),
        ...viewedPosts.map(v => v.post_id)
      ])];

      if (interactedPostIds.length > 0) {
        const interactedPosts = await Post.find({ _id: { $in: interactedPostIds } })
          .populate({ path: 'place', select: 'category_id' });

        const categoryIds = [...new Set(
          interactedPosts.filter(p => p.place?.category_id).map(p => p.place.category_id)
        )];

        if (categoryIds.length > 0) {
          const matchingPlaces = await Place.find({ category_id: { $in: categoryIds } }).select('_id');
          const placeIds = matchingPlaces.map(p => p._id);

          recommendedPosts = await Post.find({
            status: 'published',
            _id: { $nin: interactedPostIds },
            place_id: { $in: placeIds }
          })
            .populate('author', 'id full_name avatar_url')
            .populate({
              path: 'place',
              select: 'id name province slug category_id',
              populate: { path: 'category', select: 'id name icon' }
            })
            .populate('images', 'id image_url is_cover')
            .populate('likes', 'user_id')
            .sort({ view_count: -1 })
            .limit(12);
        }
      }
    }

    // Fallback: nếu chưa đủ 6 bài thì bù bằng popular posts
    if (recommendedPosts.length < 6) {
      const excludedIds = [
        ...interactedPostIds,
        ...recommendedPosts.map(p => p.id || p._id)
      ];
      const fallback = await Post.find({
        status: 'published',
        _id: { $nin: excludedIds }
      })
        .populate('author', 'id full_name avatar_url')
        .populate({
          path: 'place',
          select: 'id name province slug category_id',
          populate: { path: 'category', select: 'id name icon' }
        })
        .populate('images', 'id image_url is_cover')
        .populate('likes', 'user_id')
        .sort({ view_count: -1 })
        .limit(12 - recommendedPosts.length);

      recommendedPosts = [...recommendedPosts, ...fallback];
    }

    return recommendedPosts;
  }
}

const serviceInstance = new RecommendationService();
export { serviceInstance as RecommendationService };
export default serviceInstance;
