import BaseRepository from './base.repository.js';
import { Trip, TripDay, TripPlace, Post } from '../models/index.js';

class TripRepository extends BaseRepository {
  constructor() {
    super(Trip);
  }

  async getUserTrips(userId) {
    return await this.model.find({ user_id: userId })
      .populate({
        path: 'days',
        options: { sort: { day_number: 1 } },
        populate: {
          path: 'places',
          populate: {
            path: 'place',
            select: 'id name province latitude longitude avg_rating category_id'
          }
        }
      })
      .sort({ created_at: -1 });
  }

  async getUserTripsBrief(userId) {
    return await this.model.find({ user_id: userId })
      .select('_id id title start_date end_date total_days is_public description created_at')
      .sort({ created_at: -1 });
  }

  async getTripByIdWithDetails(tripId) {
    return await this.model.findById(tripId)
      .populate('user', 'id full_name avatar_url')
      .populate({
        path: 'days',
        options: { sort: { day_number: 1 } },
        populate: {
          path: 'places',
          populate: {
            path: 'place',
            populate: { path: 'category' }
          }
        }
      });
  }

  async isAttachedToPublicPost(tripId) {
    return await Post.exists({ trip_id: tripId, status: 'published' });
  }

  async createTripDay(dayData) {
    return await TripDay.create(dayData);
  }

  async deleteTripDays(tripId) {
    const days = await TripDay.find({ trip_id: tripId });
    const dayIds = days.map(d => d._id);
    await TripPlace.deleteMany({ trip_day_id: { $in: dayIds } });
    await TripDay.deleteMany({ trip_id: tripId });
  }

  async addPlaceToDay(placeData) {
    return await TripPlace.create(placeData);
  }

  async deleteTripPlace(placeId) {
    return await TripPlace.findByIdAndDelete(placeId);
  }

  async findTripDayById(dayId) {
    return await TripDay.findById(dayId).populate('places');
  }

  async findTripPlaceById(placeId) {
    return await TripPlace.findById(placeId);
  }
}

const repoInstance = new TripRepository();
export { repoInstance as TripRepository };
export default repoInstance;
