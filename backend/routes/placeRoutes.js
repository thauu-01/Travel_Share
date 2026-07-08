const router = require('express').Router();
const place = require('../controllers/PlaceController');
const { authenticate } = require('../middlewares/auth');
const { uploadSingle, handleUploadError } = require('../middlewares/upload');

router.get('/', place.getAll);
router.get('/provinces', place.getProvinces);
router.get('/:id', place.getById);
router.post('/', authenticate, uploadSingle, handleUploadError, place.create);

module.exports = router;
