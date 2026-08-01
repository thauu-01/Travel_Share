const router = require('express').Router();
const place = require('../controllers/PlaceController');
const admin = require('../controllers/AdminController');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { uploadPlaceSingle, handleUploadError } = require('../middlewares/upload');

// Public/User routes
router.get('/', place.getAll);
router.get('/provinces', place.getProvinces);
router.get('/:id', place.getById);
router.post('/', authenticate, uploadPlaceSingle, handleUploadError, place.create);

// Admin place management routes
router.get('/admin/list', authenticate, requireAdmin, admin.getPlaces);
router.post('/admin/create', authenticate, requireAdmin, admin.createPlace);
router.put('/:id', authenticate, requireAdmin, admin.updatePlace);
router.delete('/:id', authenticate, requireAdmin, admin.deletePlace);

module.exports = router;
