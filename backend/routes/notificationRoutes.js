const router = require('express').Router();
const notif = require('../controllers/NotificationController');
const { authenticate } = require('../middlewares/auth');

router.get('/', authenticate, notif.getAll);
router.put('/:id/read', authenticate, notif.markAsRead);
router.put('/read-all', authenticate, notif.markAllRead);

module.exports = router;
