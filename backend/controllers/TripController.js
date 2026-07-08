const { Trip, TripDay, TripPlace, Place, Category } = require('../models');

class TripController {
  async getAll(req, res) {
    try {
      const trips = await Trip.find({ user_id: req.user.id })
        .populate({
          path: 'days',
          populate: {
            path: 'places',
            populate: {
              path: 'place',
              select: 'id name province latitude longitude'
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

  async getById(req, res) {
    try {
      const trip = await Trip.findById(req.params.id)
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
      if (!trip.is_public && trip.user_id !== req.user?.id) {
        return res.status(403).json({ success: false, message: 'Lịch trình này không công khai' });
      }
      res.json({ success: true, data: trip });
    } catch (error) {
      console.error('GetById trip error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  async create(req, res) {
    try {
      const { title, description, start_date, end_date, is_public, days } = req.body;
      if (!title) return res.status(400).json({ success: false, message: 'Tiêu đề không được để trống' });
      
      const trip = await Trip.create({
        title,
        description,
        user_id: req.user.id,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        is_public: is_public !== undefined ? is_public : true
      });

      if (days && days.length > 0) {
        for (const day of days) {
          const tripDay = await TripDay.create({
            trip_id: trip.id,
            day_number: day.day_number,
            date: day.date ? new Date(day.date) : null,
            note: day.note
          });
          if (day.places && day.places.length > 0) {
            for (const place of day.places) {
              await TripPlace.create({
                trip_day_id: tripDay.id,
                place_id: parseInt(place.place_id),
                order_index: place.order_index,
                note: place.note
              });
            }
          }
        }
      }

      const fullTrip = await Trip.findById(trip.id)
        .populate({
          path: 'days',
          populate: {
            path: 'places',
            populate: { path: 'place' }
          }
        });

      res.status(201).json({ success: true, message: 'Tạo lịch trình thành công', data: fullTrip });
    } catch (error) {
      console.error('Create trip error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  async update(req, res) {
    try {
      const trip = await Trip.findById(req.params.id);
      if (!trip) return res.status(404).json({ success: false, message: 'Không tìm thấy lịch trình' });
      if (trip.user_id !== req.user.id) return res.status(403).json({ success: false, message: 'Không có quyền' });
      
      const { title, description, start_date, end_date, is_public } = req.body;
      if (title !== undefined) trip.title = title;
      if (description !== undefined) trip.description = description;
      if (start_date !== undefined) trip.start_date = start_date ? new Date(start_date) : null;
      if (end_date !== undefined) trip.end_date = end_date ? new Date(end_date) : null;
      if (is_public !== undefined) trip.is_public = is_public;

      await trip.save();
      res.json({ success: true, message: 'Cập nhật thành công', data: trip });
    } catch (error) {
      console.error('Update trip error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  async delete(req, res) {
    try {
      const trip = await Trip.findById(req.params.id);
      if (!trip) return res.status(404).json({ success: false, message: 'Không tìm thấy lịch trình' });
      if (trip.user_id !== req.user.id) return res.status(403).json({ success: false, message: 'Không có quyền' });

      // Cascade delete days and places manually
      const tripDays = await TripDay.find({ trip_id: trip.id });
      const tripDayIds = tripDays.map(td => td._id);
      
      await TripPlace.deleteMany({ trip_day_id: { $in: tripDayIds } });
      await TripDay.deleteMany({ trip_id: trip.id });
      await trip.deleteOne();

      res.json({ success: true, message: 'Xóa lịch trình thành công' });
    } catch (error) {
      console.error('Delete trip error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  async addDay(req, res) {
    try {
      const trip = await Trip.findById(req.params.id);
      if (!trip || trip.user_id !== req.user.id) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
      
      const lastDay = await TripDay.findOne({ trip_id: trip.id }).sort({ day_number: -1 });
      const day = await TripDay.create({
        trip_id: trip.id,
        day_number: (lastDay?.day_number || 0) + 1,
        date: req.body.date ? new Date(req.body.date) : null,
        note: req.body.note
      });
      res.status(201).json({ success: true, data: day });
    } catch (error) {
      console.error('AddDay error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  async addPlaceToDay(req, res) {
    try {
      const { place_id, order_index, note } = req.body;
      const tripDay = await TripDay.findById(req.params.dayId);
      if (!tripDay) return res.status(404).json({ success: false, message: 'Không tìm thấy ngày' });
      
      const tripPlace = await TripPlace.create({
        trip_day_id: tripDay.id,
        place_id: parseInt(place_id),
        order_index: order_index || 0,
        note
      });
      
      const full = await TripPlace.findById(tripPlace.id).populate('place');
      res.status(201).json({ success: true, data: full });
    } catch (error) {
      console.error('AddPlaceToDay error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }
}

module.exports = new TripController();
