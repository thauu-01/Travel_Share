const router = require('express').Router();
const { Category } = require('../models');
const admin = require('../controllers/AdminController');
const { authenticate, requireAdmin } = require('../middlewares/auth');

// Public route to get categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('GetCategories error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Admin category management routes
router.post('/', authenticate, requireAdmin, admin.createCategory);
router.put('/:id', authenticate, requireAdmin, admin.updateCategory);
router.delete('/:id', authenticate, requireAdmin, admin.deleteCategory);

module.exports = router;
