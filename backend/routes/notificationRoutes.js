const router = require('express').Router();
const notif = require('../controllers/NotificationController');
const admin = require('../controllers/AdminController');
const { authenticate, requireAdmin } = require('../middlewares/auth');

// User routes
router.get('/', authenticate, notif.getAll);
router.put('/:id/read', authenticate, notif.markAsRead);
router.put('/read-all', authenticate, notif.markAllRead);

// Admin routes
router.post('/broadcast', authenticate, requireAdmin, admin.broadcastNotification);

module.exports = router;
