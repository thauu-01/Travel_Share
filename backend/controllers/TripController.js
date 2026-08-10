const { Trip, TripDay, TripPlace, Place, Post } = require('../models');
const { getNextSequenceValue } = require('../models/counter');

class TripController {
  // GET /api/trips — Lấy tất cả lịch trình của user hiện tại
  async getAll(req, res) {
    try {
      const trips = await Trip.find({ user_id: req.user.id })
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
      res.json({ success: true, data: trips });
    } catch (error) {
      console.error('GetAll trips error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // GET /api/trips/my-trips — Danh sách lịch trình ngắn để đính kèm vào bài viết
  async getMyTrips(req, res) {
    try {
      const trips = await Trip.find({ user_id: req.user.id })
        .select('_id id title start_date end_date total_days is_public description created_at')
        .sort({ created_at: -1 });
      res.json({ success: true, data: trips });
    } catch (error) {
      console.error('GetMyTrips error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // GET /api/trips/:id — Chi tiết lịch trình
  async getById(req, res) {
    try {
      const trip = await Trip.findById(req.params.id)
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

      if (!trip) return res.status(404).json({ success: false, message: 'Không tìm thấy lịch trình' });

      // Auto update total_days if dates are present
      if (trip.start_date && trip.end_date) {
        const start = new Date(trip.start_date).setUTCHours(0, 0, 0, 0);
        const end = new Date(trip.end_date).setUTCHours(0, 0, 0, 0);
        const diffDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
        if (diffDays > 0 && trip.total_days !== diffDays) {
          trip.total_days = diffDays;
          await trip.save();
        }
      }

      const isOwner = req.user && String(trip.user_id) === String(req.user.id);
      const isAttachedToPublicPost = await Post.exists({ trip_id: trip.id, status: 'published' });

      if (!isOwner && !trip.is_public && !isAttachedToPublicPost) {
        return res.status(403).json({ success: false, message: 'Lịch trình này ở chế độ riêng tư và chưa được đính kèm bài viết nào' });
      }

      res.json({ success: true, data: trip });
    } catch (error) {
      console.error('GetById trip error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // GET /api/trips/:id/days — Lấy danh sách ngày
  async getDays(req, res) {
    try {
      const trip = await Trip.findById(req.params.id)
        .populate({
          path: 'days',
          options: { sort: { day_number: 1 } },
          populate: {
            path: 'places',
            populate: { path: 'place' }
          }
        });

      if (!trip) return res.status(404).json({ success: false, message: 'Không tìm thấy lịch trình' });

      const isOwner = req.user && String(trip.user_id) === String(req.user.id);
      const isAttachedToPublicPost = await Post.exists({ trip_id: trip.id, status: 'published' });

      if (!isOwner && !trip.is_public && !isAttachedToPublicPost) {
        return res.status(403).json({ success: false, message: 'Lịch trình này ở chế độ riêng tư và chưa được đính kèm bài viết nào' });
      }

      res.json({ success: true, data: trip.days || [] });
    } catch (error) {
      console.error('GetDays trip error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // POST /api/trips — Tạo lịch trình mới (chỉ lưu metadata, không tự tạo ngày rỗng)
  async create(req, res) {
    try {
      const { title, description, start_date, end_date, is_public } = req.body;
      if (!title || !title.trim()) {
        return res.status(400).json({ success: false, message: 'Tiêu đề không được để trống' });
      }

      let startDateObj = null;
      let endDateObj = null;

      if (start_date && end_date) {
        startDateObj = new Date(start_date);
        endDateObj = new Date(end_date);
        startDateObj.setUTCHours(0, 0, 0, 0);
        endDateObj.setUTCHours(0, 0, 0, 0);

        if (endDateObj < startDateObj) {
          return res.status(400).json({ success: false, message: 'Ngày kết thúc không được nhỏ hơn ngày bắt đầu' });
        }

        const diffDays = Math.floor((endDateObj - startDateObj) / (1000 * 60 * 60 * 24)) + 1;
        if (diffDays > 60) {
          return res.status(400).json({ success: false, message: 'Số ngày của chuyến đi không được vượt quá 60 ngày' });
        }
      }

      const trip = await Trip.create({
        title: title.trim(),
        description: description ? description.trim() : null,
        user_id: req.user.id,
        start_date: startDateObj,
        end_date: endDateObj,
        is_public: is_public !== undefined ? Boolean(is_public) : true
      });

      const fullTrip = await Trip.findById(trip.id).populate('days');
      res.status(201).json({ success: true, message: 'Tạo lịch trình thành công', data: fullTrip });
    } catch (error) {
      console.error('Create trip error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // PUT /api/trips/:id — Cập nhật lịch trình
  async update(req, res) {
    try {
      const trip = await Trip.findById(req.params.id);
      if (!trip) return res.status(404).json({ success: false, message: 'Không tìm thấy lịch trình' });
      if (String(trip.user_id) !== String(req.user.id)) {
        return res.status(403).json({ success: false, message: 'Không có quyền' });
      }

      const { title, description, start_date, end_date, is_public } = req.body;
      if (title !== undefined) trip.title = title.trim();
      if (description !== undefined) trip.description = description ? description.trim() : null;
      if (is_public !== undefined) trip.is_public = Boolean(is_public);

      if (start_date && end_date) {
        const s = new Date(start_date);
        const e = new Date(end_date);
        s.setUTCHours(0, 0, 0, 0);
        e.setUTCHours(0, 0, 0, 0);
        if (e < s) {
          return res.status(400).json({ success: false, message: 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu' });
        }
        trip.start_date = s;
        trip.end_date = e;
      }

      await trip.save();
      res.json({ success: true, message: 'Cập nhật thành công', data: trip });
    } catch (error) {
      console.error('Update trip error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // DELETE /api/trips/:id — Xóa lịch trình (Cascade Delete + Gỡ trip_id ở Bài viết)
  async delete(req, res) {
    try {
      const trip = await Trip.findById(req.params.id);
      if (!trip) return res.status(404).json({ success: false, message: 'Không tìm thấy lịch trình' });
      if (String(trip.user_id) !== String(req.user.id)) {
        return res.status(403).json({ success: false, message: 'Không có quyền' });
      }

      // Cascade delete days and places
      const tripDays = await TripDay.find({ trip_id: trip.id });
      const tripDayIds = tripDays.map(td => td._id);
      await TripPlace.deleteMany({ trip_day_id: { $in: tripDayIds } });
      await TripDay.deleteMany({ trip_id: trip.id });

      // Clear trip_id on linked posts
      await Post.updateMany({ trip_id: trip.id }, { trip_id: null });

      await trip.deleteOne();
      res.json({ success: true, message: 'Xóa lịch trình thành công' });
    } catch (error) {
      console.error('Delete trip error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // POST /api/trips/:id/days — Thêm ngày tự động tuần tự
  async addDay(req, res) {
    try {
      const trip = await Trip.findById(req.params.id);
      if (!trip || String(trip.user_id) !== String(req.user.id)) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy lịch trình hoặc không có quyền' });
      }

      const currentDaysCount = await TripDay.countDocuments({ trip_id: trip.id });
      let maxDays = trip.total_days || 1;

      if (trip.start_date && trip.end_date) {
        const start = new Date(trip.start_date).setUTCHours(0, 0, 0, 0);
        const end = new Date(trip.end_date).setUTCHours(0, 0, 0, 0);
        const diffDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
        if (diffDays > 0) {
          maxDays = diffDays;
          if (trip.total_days !== diffDays) {
            trip.total_days = diffDays;
            await trip.save();
          }
        }
      }

      if (currentDaysCount >= maxDays) {
        return res.status(400).json({
          success: false,
          message: `Đã đủ số ngày trong lịch trình (${currentDaysCount}/${maxDays} ngày)`
        });
      }

      const nextDayNumber = currentDaysCount + 1;
      let nextDate = null;
      if (trip.start_date) {
        const startMs = new Date(trip.start_date).getTime();
        nextDate = new Date(startMs + currentDaysCount * 24 * 60 * 60 * 1000);
      }

      const day = await TripDay.create({
        trip_id: trip.id,
        day_number: nextDayNumber,
        date: nextDate,
        note: req.body.note ? req.body.note.trim() : null
      });

      res.status(201).json({ success: true, message: `Đã thêm Ngày ${nextDayNumber}!`, data: day });
    } catch (error) {
      console.error('AddDay error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // PATCH /api/trips/:id/days/:dayId — Sửa nội dung 1 ngày
  async updateDay(req, res) {
    try {
      const trip = await Trip.findById(req.params.id);
      if (!trip || String(trip.user_id) !== String(req.user.id)) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy lịch trình' });
      }

      const tripDay = await TripDay.findOne({ _id: req.params.dayId, trip_id: trip.id });
      if (!tripDay) return res.status(404).json({ success: false, message: 'Không tìm thấy ngày' });

      if (req.body.note !== undefined) tripDay.note = req.body.note ? req.body.note.trim() : null;
      await tripDay.save();

      res.json({ success: true, message: 'Cập nhật ngày thành công', data: tripDay });
    } catch (error) {
      console.error('UpdateDay error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // DELETE /api/trips/:id/days/:dayId — Xóa 1 ngày & Đánh lại số thứ tự (Renumbering)
  async deleteDay(req, res) {
    try {
      const trip = await Trip.findById(req.params.id);
      if (!trip || String(trip.user_id) !== String(req.user.id)) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy lịch trình' });
      }

      const tripDay = await TripDay.findOne({ _id: req.params.dayId, trip_id: trip.id });
      if (!tripDay) return res.status(404).json({ success: false, message: 'Không tìm thấy ngày' });

      // Delete places in this day
      await TripPlace.deleteMany({ trip_day_id: tripDay.id });
      await tripDay.deleteOne();

      // Renumber remaining days
      const remainingDays = await TripDay.find({ trip_id: trip.id }).sort({ day_number: 1 });
      for (let i = 0; i < remainingDays.length; i++) {
        const d = remainingDays[i];
        d.day_number = i + 1;
        if (trip.start_date) {
          const startMs = new Date(trip.start_date).getTime();
          d.date = new Date(startMs + i * 24 * 60 * 60 * 1000);
        }
        await d.save();
      }

      res.json({ success: true, message: 'Đã xóa ngày và cập nhật lại lịch trình' });
    } catch (error) {
      console.error('DeleteDay error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // POST /api/trips/:tripId/days/:dayId/places — Thêm địa điểm vào ngày (Hệ thống, Tự nhập thủ công, hoặc Tìm trên Bản đồ / Map API)
  async addPlaceToDay(req, res) {
    try {
      let { place_id, place_name, province, latitude, longitude, order_index, note } = req.body;
      const tripDay = await TripDay.findById(req.params.dayId);
      if (!tripDay) return res.status(404).json({ success: false, message: 'Không tìm thấy ngày' });

      // If place_id is not passed but custom place_name is provided, auto-create/find Place in DB
      if (!place_id && place_name && place_name.trim()) {
        const cleanName = place_name.trim();
        let existingPlace = await Place.findOne({ name: new RegExp('^' + cleanName + '$', 'i') });
        if (!existingPlace) {
          const slugStr = cleanName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
          existingPlace = await Place.create({
            name: cleanName,
            province: province ? province.trim() : 'Việt Nam',
            latitude: latitude ? parseFloat(latitude) : 10.7769,
            longitude: longitude ? parseFloat(longitude) : 106.7009,
            slug: `${slugStr}-${Date.now()}`,
            user_id: req.user.id
          });
        }
        place_id = existingPlace.id;
      }

      if (!place_id) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn từ hệ thống hoặc nhập tên địa điểm' });
      }

      const tripPlace = await TripPlace.create({
        trip_day_id: tripDay.id,
        place_id: parseInt(place_id),
        order_index: order_index || 0,
        note: note ? note.trim() : null
      });

      const full = await TripPlace.findById(tripPlace.id).populate('place');
      res.status(201).json({ success: true, data: full });
    } catch (error) {
      console.error('AddPlaceToDay error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // DELETE /api/trips/:tripId/days/:dayId/places/:placeId — Xóa địa điểm khỏi ngày
  async removePlaceFromDay(req, res) {
    try {
      const tripDay = await TripDay.findById(req.params.dayId);
      if (!tripDay) return res.status(404).json({ success: false, message: 'Không tìm thấy ngày' });

      await TripPlace.deleteMany({ trip_day_id: tripDay.id, place_id: parseInt(req.params.placeId) });
      res.json({ success: true, message: 'Đã xóa địa điểm khỏi ngày' });
    } catch (error) {
      console.error('RemovePlaceFromDay error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // POST /api/trips/generate-ai — AI Tạo Lịch Trình VIP
  async generateAITrip(req, res) {
    const { province, total_days, budget, style } = req.body;
    const userId = req.user.id;

    if (!province || !total_days) {
      return res.status(400).json({ success: false, message: 'Thiếu địa điểm hoặc số ngày' });
    }

    // ① Atomic: Trừ 1 credit — chặn race condition (2 tab đồng thời khi còn 1 credit)
    const user = await require('../models/User').findOneAndUpdate(
      {
        _id: userId,
        $or: [
          { ai_credits: { $gt: 0 } },
          { ai_credits: { $exists: false } },
          { is_vip: true }
        ]
      },
      { $inc: { ai_credits: -1 } },
      { new: true }
    );

    if (!user) {
      return res.status(403).json({
        success: false,
        message: 'Bạn đã hết lượt AI Credits. Vui lòng mua thêm gói VIP.',
        need_purchase: true
      });
    }

    // ② Bọc toàn bộ AI call + DB write trong try/catch để hoàn credit nếu lỗi
    const mongoose = require('../config/database');
    const session = await mongoose.startSession();
    try {
      // Lấy danh sách địa điểm thực tế trong DB theo tỉnh thành
      const places = await Place.find({ province: new RegExp(province, 'i') }).limit(20);

      // Xây dựng prompt cho Groq AI
      const placeList = places.length > 0
        ? places.map(p => `- ${p.name} (${p.address || p.province}, đánh giá: ${p.avg_rating || 'N/A'})`).join('\n')
        : `Các địa điểm nổi tiếng tại ${province}`;

      const systemPrompt = `Bạn là chuyên gia du lịch Việt Nam. Hãy tạo lịch trình du lịch chi tiết theo yêu cầu.
Trả về JSON hợp lệ ĐÚNG FORMAT sau (không thêm text nào khác):
{
  "title": "Tiêu đề chuyến đi",
  "description": "Mô tả ngắn",
  "days": [
    {
      "day_number": 1,
      "note": "Ghi chú cho ngày (sáng/chiều/tối)",
      "places": [
        { "name": "Tên địa điểm", "note": "Hoạt động gợi ý" }
      ]
    }
  ]
}`;

      const userPrompt = `Tạo lịch trình ${total_days} ngày tại ${province}.
Ngân sách: ${budget || 'linh hoạt'}.
Phong cách: ${style || 'tổng hợp'}.
Các địa điểm có trong hệ thống:\n${placeList}`;

      // Gọi Groq AI
      const Groq = require('groq-sdk');
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const content = completion.choices[0]?.message?.content || '';

      // Parse JSON từ AI response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('AI response không đúng format JSON');
      const aiResult = JSON.parse(jsonMatch[0]);

      if (!aiResult.days || !Array.isArray(aiResult.days)) {
        throw new Error('AI response thiếu trường days');
      }

      // ③ MongoDB Atlas Transaction — tạo Trip + TripDay + TripPlace atomic
      session.startTransaction();

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + parseInt(total_days) - 1);

      const tripId = await getNextSequenceValue('trips');
      const [trip] = await Trip.create([{
        _id: tripId,
        user_id: userId,
        title: aiResult.title || `Khám phá ${province} ${total_days} ngày`,
        description: aiResult.description || `Lịch trình AI tạo tự động cho ${province}`,
        start_date: startDate,
        end_date: endDate,
        total_days: parseInt(total_days),
        is_public: false
      }], { session });

      // Tạo TripDay với ID từ counter
      const createdDays = [];
      for (const day of aiResult.days) {
        const dayId = await getNextSequenceValue('trip_days');
        createdDays.push({
          _id: dayId,
          trip_id: trip._id,
          day_number: day.day_number,
          date: new Date(startDate.getTime() + (day.day_number - 1) * 86400000),
          note: day.note || ''
        });
      }
      await TripDay.insertMany(createdDays, { session });

      // Match tên địa điểm AI gợi ý với DB Places (nếu có)
      const allPlaceNames = aiResult.days.flatMap(d => d.places?.map(p => p.name) || []);
      const dbPlaces = await Place.find({
        name: { $in: allPlaceNames.map(n => new RegExp(n, 'i')) }
      }).session(session);
      const placeNameMap = {};
      dbPlaces.forEach(p => { placeNameMap[p.name.toLowerCase()] = p._id; });

      // Tạo TripPlace với ID từ counter
      const tripPlacesData = [];
      for (let i = 0; i < aiResult.days.length; i++) {
        const day = aiResult.days[i];
        const dayDoc = createdDays[i];
        if (!day.places || !dayDoc) continue;

        for (let order = 0; order < day.places.length; order++) {
          const p = day.places[order];
          const matchedId = Object.keys(placeNameMap).find(key =>
            p.name.toLowerCase().includes(key) || key.includes(p.name.toLowerCase())
          );
          const placeId = await getNextSequenceValue('trip_places');
          tripPlacesData.push({
            _id: placeId,
            trip_day_id: dayDoc._id,
            place_id: matchedId ? placeNameMap[matchedId] : null,
            custom_place_name: matchedId ? null : p.name,
            note: p.note || '',
            order_index: order
          });
        }
      }

      if (tripPlacesData.length > 0) {
        await TripPlace.insertMany(tripPlacesData, { session });
      }

      await session.commitTransaction();

      // Lấy trip đầy đủ để trả về
      const fullTrip = await Trip.findById(trip._id)
        .populate({
          path: 'days',
          options: { sort: { day_number: 1 } },
          populate: { path: 'places', populate: { path: 'place', select: 'id name province latitude longitude' } }
        });

      return res.json({
        success: true,
        message: `🎉 AI đã tạo lịch trình ${total_days} ngày tại ${province} thành công!`,
        data: fullTrip,
        ai_credits_remaining: user.is_vip ? null : Math.max(0, user.ai_credits - 1)
      });

    } catch (err) {
      // Rollback MongoDB transaction
      try { await session.abortTransaction(); } catch (_) {}

      // ④ Hoàn credit nếu không phải VIP (VIP không bị trừ thật sự về nghiệp vụ)
      if (!user.is_vip) {
        await require('../models/User').findByIdAndUpdate(userId, { $inc: { ai_credits: 1 } });
      }

      console.error('generateAITrip error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Tạo lịch trình AI thất bại. Credit đã được hoàn lại.',
        error: err.message
      });
    } finally {
      session.endSession();
    }
  }
}

module.exports = new TripController();

