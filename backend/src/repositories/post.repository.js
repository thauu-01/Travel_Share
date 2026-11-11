import BaseRepository from './base.repository.js';
import { Post, PostImage, Like, ViewHistory, Place, User } from '../models/index.js';

class PostRepository extends BaseRepository {
  constructor() {
    super(Post);
  }

  async getPostsWithFilter({ page = 1, limit = 12, category, province, rating, sort = 'newest', search }) {
    const limitNum = parseInt(limit);
    const skipNum = (parseInt(page) - 1) * limitNum;

    const where = { status: 'published' };

    // Lọc theo Category / Province
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

    if (search && search.trim()) {
      const searchTerm = search.trim();
      const fullRegex = new RegExp(searchTerm, 'i');

      const matchingPlaceIds = await Place.find({
        $or: [
          { name: fullRegex },
          { province: fullRegex },
          { address: fullRegex },
          { description: fullRegex }
        ]
      }).select('_id').then(places => places.map(p => p._id));

      const matchingUserIds = await User.find({
        full_name: fullRegex
      }).select('_id').then(users => users.map(u => u._id));

      const searchOrClauses = [
        { title: fullRegex },
        { content: fullRegex }
      ];

      if (matchingPlaceIds.length > 0) {
        searchOrClauses.push({ place_id: { $in: matchingPlaceIds } });
      }
      if (matchingUserIds.length > 0) {
        searchOrClauses.push({ user_id: { $in: matchingUserIds } });
      }

      if (where.place_id) {
        const filteredPlaceIds = where.place_id.$in;
        const intersection = matchingPlaceIds.filter(id => filteredPlaceIds.includes(id));
        where.$or = [
          { title: fullRegex },
          { content: fullRegex },
          { place_id: { $in: intersection } }
        ];
        delete where.place_id;
      } else {
        where.$or = searchOrClauses;
      }
    }

    let sortObj = { created_at: -1 };
    if (sort === 'popular') sortObj = { view_count: -1 };
    if (sort === 'rating') sortObj = { rating: -1 };

    const total = await this.model.countDocuments(where);
    const posts = await this.model.find(where)
      .populate('author', 'id full_name avatar_url')
      .populate({
        path: 'place',
        select: 'id name province latitude longitude slug category_id',
        populate: { path: 'category', select: 'id name slug icon' }
      })
      .populate('trip', 'id title start_date end_date total_days is_public')
      .populate('images', 'id image_url is_cover')
      .populate('likes', 'user_id')
      .sort(sortObj)
      .limit(limitNum)
      .skip(skipNum);

    return {
      posts,
      pagination: {
        total,
        page: parseInt(page),
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  }

  async getPostByIdWithDetails(postId) {
    return await this.model.findById(postId)
      .populate('author', 'id full_name avatar_url bio')
      .populate({
        path: 'place',
        select: 'id name province latitude longitude slug category_id',
        populate: { path: 'category', select: 'id name slug icon' }
      })
      .populate({
        path: 'trip',
        populate: {
          path: 'days',
          options: { sort: { day_number: 1 } },
          populate: {
            path: 'places',
            populate: { path: 'place' }
          }
        }
      })
      .populate('images', 'id image_url is_cover')
      .populate('likes', 'user_id');
  }

  async incrementViews(postId, userId = null) {
    await this.model.findByIdAndUpdate(postId, { $inc: { view_count: 1 } });
    if (userId) {
      await ViewHistory.create({
        user_id: userId,
        post_id: parseInt(postId),
        viewed_at: new Date()
      });
    }
  }

  async toggleLike(postId, userId) {
    const existing = await Like.findOne({ post_id: parseInt(postId), user_id: userId });
    if (existing) {
      await existing.deleteOne();
      return { liked: false };
    } else {
      await Like.create({ post_id: parseInt(postId), user_id: userId });
      return { liked: true };
    }
  }

  async countLikes(filter = {}) {
    return await Like.countDocuments(filter);
  }

  async getTopLikedPosts(limit = 3) {
    const topLikes = await Like.aggregate([
      { $group: { _id: '$post_id', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit }
    ]);
    const postIds = topLikes.map(l => l._id);
    const posts = await this.model.find({ _id: { $in: postIds }, is_hidden: { $ne: true } })
      .populate('author', 'full_name');
    return { topLikes, posts };
  }

  async getTopViewedPosts(limit = 5) {
    return await this.model.find({ is_hidden: { $ne: true }, status: 'published' })
      .sort({ view_count: -1, created_at: -1 })
      .limit(limit)
      .populate('author', 'full_name')
      .populate('place', 'name province');
  }

  async createPostImages(imagesData) {
    return await PostImage.insertMany(imagesData);
  }

  async deletePostImages(postId) {
    return await PostImage.deleteMany({ post_id: postId });
  }
}

const repoInstance = new PostRepository();
export { repoInstance as PostRepository };
export default repoInstance;
