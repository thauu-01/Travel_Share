import tripRepository from '../repositories/trip.repository.js';
import userRepository from '../repositories/user.repository.js';
import placeRepository from '../repositories/place.repository.js';
import { getGeminiClient, getGroqClient } from '../config/ai.config.js';
import { calculateDaysBetween } from '../utils/date.util.js';
import ApiError from '../utils/apiError.js';

class TripService {
  async getAllUserTrips(userId) {
    return await tripRepository.getUserTrips(userId);
  }

  async getMyTripsBrief(userId) {
    return await tripRepository.getUserTripsBrief(userId);
  }

  async getTripById(tripId, currentUser = null) {
    const trip = await tripRepository.getTripByIdWithDetails(tripId);
    if (!trip) throw ApiError.notFound('Không tìm thấy lịch trình');

    // Tự động tính số ngày nếu có start_date và end_date
    if (trip.start_date && trip.end_date) {
      const calculatedDays = calculateDaysBetween(trip.start_date, trip.end_date);
      if (trip.total_days !== calculatedDays) {
        trip.total_days = calculatedDays;
        await trip.save();
      }
    }

    const isOwner = currentUser && String(trip.user_id) === String(currentUser.id);
    const isAttachedToPost = await tripRepository.isAttachedToPublicPost(trip.id || trip._id);

    if (!isOwner && !trip.is_public && !isAttachedToPost) {
      throw ApiError.forbidden('Lịch trình này ở chế độ riêng tư và chưa được đính kèm bài viết nào');
    }

    return trip;
  }

  async createTrip(userId, { title, description, start_date, end_date, is_public }) {
    const totalDays = (start_date && end_date) ? calculateDaysBetween(start_date, end_date) : 1;

    const trip = await tripRepository.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      start_date: start_date || null,
      end_date: end_date || null,
      total_days: totalDays,
      is_public: Boolean(is_public),
      user_id: userId
    });

    // Tự động tạo các ngày mẫu tương ứng
    for (let i = 1; i <= totalDays; i++) {
      await tripRepository.createTripDay({
        trip_id: trip.id || trip._id,
        day_number: i,
        title: `Ngày ${i}`
      });
    }

    return await tripRepository.getTripByIdWithDetails(trip.id || trip._id);
  }

  async updateTrip(tripId, userId, { title, description, start_date, end_date, is_public }) {
    const trip = await tripRepository.findById(tripId);
    if (!trip) throw ApiError.notFound('Không tìm thấy lịch trình');

    if (String(trip.user_id) !== String(userId)) {
      throw ApiError.forbidden('Bạn không có quyền chỉnh sửa lịch trình này');
    }

    if (title) trip.title = title.trim();
    if (description !== undefined) trip.description = description.trim();
    if (is_public !== undefined) trip.is_public = Boolean(is_public);

    if (start_date) trip.start_date = start_date;
    if (end_date) trip.end_date = end_date;
    if (trip.start_date && trip.end_date) {
      trip.total_days = calculateDaysBetween(trip.start_date, trip.end_date);
    }

    await trip.save();
    return await tripRepository.getTripByIdWithDetails(trip.id || trip._id);
  }

  async deleteTrip(tripId, userId, userRole) {
    const trip = await tripRepository.findById(tripId);
    if (!trip) throw ApiError.notFound('Không tìm thấy lịch trình');

    if (String(trip.user_id) !== String(userId) && userRole !== 'admin') {
      throw ApiError.forbidden('Bạn không có quyền xóa lịch trình này');
    }

    await tripRepository.deleteTripDays(trip.id || trip._id);
    await trip.deleteOne();
    return { message: 'Xóa lịch trình thành công' };
  }

  async addDay(tripId, userId, { title, description }) {
    const trip = await tripRepository.findById(tripId);
    if (!trip) throw ApiError.notFound('Không tìm thấy lịch trình');
    if (String(trip.user_id) !== String(userId)) throw ApiError.forbidden('Không có quyền');

    const nextDayNumber = (trip.total_days || 0) + 1;
    const day = await tripRepository.createTripDay({
      trip_id: trip.id || trip._id,
      day_number: nextDayNumber,
      title: title || `Ngày ${nextDayNumber}`,
      description: description || ''
    });

    trip.total_days = nextDayNumber;
    await trip.save();

    return day;
  }

  async addPlaceToDay(dayId, userId, { place_id, order_index, note, start_time, end_time }) {
    const day = await tripRepository.findTripDayById(dayId);
    if (!day) throw ApiError.notFound('Không tìm thấy ngày trong lịch trình');

    const trip = await tripRepository.findById(day.trip_id);
    if (!trip || String(trip.user_id) !== String(userId)) {
      throw ApiError.forbidden('Không có quyền chỉnh sửa');
    }

    const place = await placeRepository.findById(place_id);
    if (!place) throw ApiError.badRequest('Địa điểm không tồn tại');

    const tripPlace = await tripRepository.addPlaceToDay({
      trip_day_id: day.id || day._id,
      place_id: parseInt(place_id),
      order_index: order_index || (day.places?.length || 0) + 1,
      note: note || '',
      start_time: start_time || null,
      end_time: end_time || null
    });

    return tripPlace;
  }

  async removePlaceFromDay(tripPlaceId, userId) {
    const tripPlace = await tripRepository.findTripPlaceById(tripPlaceId);
    if (!tripPlace) throw ApiError.notFound('Không tìm thấy địa điểm trong lịch trình');

    const day = await tripRepository.findTripDayById(tripPlace.trip_day_id);
    if (!day) throw ApiError.notFound('Không tìm thấy ngày tương ứng');

    const trip = await tripRepository.findById(day.trip_id);
    if (!trip || String(trip.user_id) !== String(userId)) {
      throw ApiError.forbidden('Không có quyền xóa');
    }

    await tripPlace.deleteOne();
    return { message: 'Đã xóa địa điểm khỏi lịch trình' };
  }

  async generateAITrip(userId, { destination, duration = 3, preferences = '' }) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('Không tìm thấy người dùng');

    if (user.ai_credits <= 0) {
      throw ApiError.forbidden('Bạn đã hết lượt dùng AI. Vui lòng nâng cấp gói VIP để tiếp tục sử dụng tính năng này.');
    }

    const prompt = `Bạn là chuyên gia thiết kế tour du lịch Việt Nam thông minh.
Hãy tạo một lịch trình du lịch chi tiết tại "${destination}" trong ${duration} ngày.
Sở thích / yêu cầu thêm: "${preferences}".
Định dạng trả về là JSON hợp lệ duy nhất, theo cấu trúc:
{
  "title": "Tên chuyến đi hấp dẫn",
  "description": "Mô tả ngắn về hành trình",
  "days": [
    {
      "day_number": 1,
      "title": "Chủ đề ngày 1",
      "activities": [
        { "name": "Tên địa điểm hoặc hoạt động", "time": "08:00 - 10:00", "note": "Chi tiết lưu ý" }
      ]
    }
  ]
}`;

    let replyJson = null;
    const gemini = getGeminiClient();

    if (gemini) {
      try {
        const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        replyJson = JSON.parse(cleanJson);
      } catch (err) {
        console.warn('Gemini AI failed, trying Groq fallback:', err.message);
      }
    }

    if (!replyJson) {
      const groq = getGroqClient();
      if (groq) {
        try {
          const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            response_format: { type: 'json_object' }
          });
          replyJson = JSON.parse(chatCompletion.choices[0]?.message?.content || '{}');
        } catch (err) {
          console.error('Groq AI failed:', err.message);
        }
      }
    }

    if (!replyJson || !replyJson.days) {
      throw ApiError.internal('Hệ thống AI đang bận hoặc quá tải, vui lòng thử lại sau giây lát.');
    }

    // Trừ 1 credit của user sau khi tạo thành công
    await userRepository.deductAiCredit(userId);

    return replyJson;
  }
}

const serviceInstance = new TripService();
export { serviceInstance as TripService };
export default serviceInstance;
