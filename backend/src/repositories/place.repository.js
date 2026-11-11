import BaseRepository from './base.repository.js';
import { Place, Post } from '../models/index.js';

class PlaceRepository extends BaseRepository {
  constructor() {
    super(Place);
  }

  async calculateRealtimeRating(placeId) {
    const result = await Post.aggregate([
      { $match: { place_id: placeId } },
      {
        $group: {
          _id: '$place_id',
          avgRating: { $avg: '$rating' },
          totalViews: { $sum: '$view_count' }
        }
      }
    ]);
    if (result.length > 0) {
      return {
        avg_rating: result[0].avgRating ? Math.round(result[0].avgRating * 10) / 10 : 0,
        view_count: result[0].totalViews || 0
      };
    }
    return { avg_rating: 0, view_count: 0 };
  }

  async getPlacesWithFilter({ category, province, search, page = 1, limit = 50 }) {
    const where = {};
    if (category) where.category_id = parseInt(category);
    if (province) where.province = { $regex: province, $options: 'i' };
    if (search) {
      where.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const limitNum = parseInt(limit);
    const skipNum = (parseInt(page) - 1) * limitNum;

    const count = await this.model.countDocuments(where);
    const rows = await this.model.find(where)
      .populate('category', 'id name slug icon')
      .populate('creator', 'id full_name')
      .sort({ view_count: -1 })
      .limit(limitNum)
      .skip(skipNum);

    const placesWithRating = await Promise.all(rows.map(async (place) => {
      const placeObj = place.toJSON();
      const ratingData = await this.calculateRealtimeRating(place._id);
      placeObj.avg_rating = ratingData.avg_rating;
      placeObj.view_count = ratingData.view_count;
      return placeObj;
    }));

    return {
      places: placesWithRating,
      pagination: {
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limitNum)
      }
    };
  }

  async getAllProvinces() {
    const provinces = await this.model.distinct('province');
    provinces.sort((a, b) => a.localeCompare(b, 'vi'));
    return provinces;
  }

  async getPlaceByIdWithDetails(placeId) {
    const place = await this.model.findById(placeId)
      .populate('category')
      .populate('creator', 'id full_name avatar_url')
      .populate({
        path: 'posts',
        match: { status: 'published' },
        options: { limit: 10, sort: { created_at: -1 } },
        populate: { path: 'author', select: 'id full_name avatar_url' }
      });

    if (!place) return null;

    place.view_count = (place.view_count || 0) + 1;
    await place.save();

    const placeObj = place.toJSON();
    const ratingData = await this.calculateRealtimeRating(place._id);
    placeObj.avg_rating = ratingData.avg_rating;
    placeObj.view_count = ratingData.view_count;

    return placeObj;
  }

  async searchPlacesByKeyword(keyword, limit = 4) {
    return await this.model.find({
      $or: [
        { province: { $regex: keyword, $options: 'i' } },
        { name: { $regex: keyword, $options: 'i' } },
        { address: { $regex: keyword, $options: 'i' } }
      ]
    }).limit(limit);
  }

  async getTopRatedPlaces(limit = 4) {
    return await this.model.find().sort({ avg_rating: -1, view_count: -1 }).limit(limit);
  }
}

const repoInstance = new PlaceRepository();
export { repoInstance as PlaceRepository };
export default repoInstance;
