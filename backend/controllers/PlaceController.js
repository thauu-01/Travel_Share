const { Place, Category, User, Post } = require('../models');

class PlaceController {
  async getAll(req, res) {
    try {
      const { category, province, search, page = 1, limit = 50 } = req.query;
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

      const count = await Place.countDocuments(where);
      const rows = await Place.find(where)
        .populate('category', 'id name slug icon')
        .populate('creator', 'id full_name')
        .sort({ view_count: -1 })
        .limit(limitNum)
        .skip(skipNum);

      res.json({
        success: true,
        data: {
          places: rows,
          pagination: {
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limitNum)
          }
        }
      });
    } catch (error) {
      console.error('GetAll places error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  async getProvinces(req, res) {
    try {
      const provinces = await Place.distinct('province');
      provinces.sort((a, b) => a.localeCompare(b, 'vi'));
      res.json({ success: true, data: provinces });
    } catch (error) {
      console.error('GetProvinces error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  async getById(req, res) {
    try {
      const place = await Place.findById(req.params.id)
        .populate('category')
        .populate('creator', 'id full_name avatar_url')
        .populate({
          path: 'posts',
          match: { status: 'published' },
          options: { limit: 10, sort: { created_at: -1 } },
          populate: { path: 'author', select: 'id full_name avatar_url' }
        });

      if (!place) return res.status(404).json({ success: false, message: 'Không tìm thấy địa điểm' });
      
      place.view_count = (place.view_count || 0) + 1;
      await place.save();
      
      res.json({ success: true, data: place });
    } catch (error) {
      console.error('GetById place error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  async create(req, res) {
    try {
      const { name, description, province, address, latitude, longitude, category_id } = req.body;
      if (!name || !province || !latitude || !longitude) {
        return res.status(400).json({ success: false, message: 'Tên, tỉnh/thành phố và tọa độ là bắt buộc' });
      }
      const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const place = await Place.create({
        name, slug, description, province, address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        category_id: category_id ? parseInt(category_id) : null,
        user_id: req.user.id,
        cover_image: req.file ? req.file.path : null
      });
      res.status(201).json({ success: true, message: 'Tạo địa điểm thành công', data: place });
    } catch (error) {
      console.error('Create place error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }
}

module.exports = new PlaceController();
