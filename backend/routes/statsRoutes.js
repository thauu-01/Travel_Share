const express = require('express');
const router = express.Router();
const admin = require('../controllers/AdminController');
const { authenticate, requireAdmin } = require('../middlewares/auth');

// GET /api/stats/dashboard (Admin dashboard statistics)
router.get('/dashboard', authenticate, requireAdmin, admin.getDashboard);

module.exports = router;
