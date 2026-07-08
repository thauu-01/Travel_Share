const router = require('express').Router({ mergeParams: true });
const comment = require('../controllers/CommentController');
const { authenticate } = require('../middlewares/auth');

router.get('/', comment.getByPost);
router.post('/', authenticate, comment.create);
router.delete('/:commentId', authenticate, comment.delete);

module.exports = router;
