const { Post, User, Place, PostImage, Like, Comment, ViewHistory, Category } = require('../models');

class RecommendationController {
  // GET /api/recommendations - Content-based + Collaborative filtering
  async getRecommendations(req, res) {
    try {
      const userId = req.user?.id;
      let recommendedPosts = [];
      let interactedPostIds = [];

      if (userId) {
        // Get categories from user's viewed/liked posts
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
          // Get categories of interacted posts
          const interactedPosts = await Post.find({ _id: { $in: interactedPostIds } })
            .populate({ path: 'place', select: 'category_id' });

          const categoryIds = [...new Set(
            interactedPosts.filter(p => p.place?.category_id).map(p => p.place.category_id)
          )];

          // Content-based: recommend posts from same categories, exclude already seen
          if (categoryIds.length > 0) {
            // Find places in matching categories
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

      // Fallback: popular posts
      if (recommendedPosts.length < 6) {
        const excludedIds = [
          ...interactedPostIds,
          ...recommendedPosts.map(p => p.id)
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

      res.json({ success: true, data: recommendedPosts });
    } catch (error) {
      console.error('Recommendation error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }
}

module.exports = new RecommendationController();
