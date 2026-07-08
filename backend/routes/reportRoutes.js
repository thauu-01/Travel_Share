const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middlewares/auth');
const admin = require('../controllers/AdminController');
const { Report } = require('../models');

// GET /api/reports — Lấy danh sách báo cáo vi phạm (Admin)
router.get('/', authenticate, requireAdmin, admin.getReports);

// PATCH /api/reports/:id — Xử lý báo cáo vi phạm (Admin)
router.patch('/:id', authenticate, requireAdmin, admin.updateReport);

// POST /api/reports — Tạo báo cáo vi phạm (User)
router.post('/', authenticate, async (req, res) => {
  try {
    const { target_type, target_id, reason, description } = req.body;
    if (!target_type || !target_id || !reason) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin báo cáo' });
    }
    
    // Check duplicate pending report from the same user
    const existing = await Report.findOne({
      reporter_id: req.user.id,
      target_type,
      target_id,
      status: 'pending'
    });
    
    if (existing) {
      return res.status(400).json({ success: false, message: 'Bạn đã báo cáo nội dung này rồi và đang chờ xử lý' });
    }
    
    const report = await Report.create({
      reporter_id: req.user.id,
      target_type,
      target_id,
      reason,
      description: description || ''
    });
    
    res.status(201).json({ success: true, message: 'Báo cáo vi phạm đã được gửi lên hệ thống', data: report });
  } catch (err) {
    console.error('Create report error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;
