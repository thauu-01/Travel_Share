const router = require('express').Router();
const auth = require('../controllers/AuthController');
const { authenticate } = require('../middlewares/auth');

router.post('/register', auth.register);
router.post('/login', auth.login);
router.get('/me', authenticate, auth.getMe);

module.exports = router;
