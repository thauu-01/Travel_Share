const router = require('express').Router();
const post = require('../controllers/PostController');
const { authenticate, optionalAuth } = require('../middlewares/auth');
const { uploadMultiple, handleUploadError } = require('../middlewares/upload');

router.get('/', optionalAuth, post.getAll);
router.get('/trending', post.getTrending);
router.get('/:id', optionalAuth, post.getById);
router.post('/', authenticate, uploadMultiple, handleUploadError, post.create);
router.put('/:id', authenticate, post.update);
router.delete('/:id', authenticate, post.delete);
router.post('/:id/like', authenticate, post.toggleLike);

module.exports = router;
