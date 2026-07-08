const router = require('express').Router();
const rec = require('../controllers/RecommendationController');
const { optionalAuth } = require('../middlewares/auth');

router.get('/', optionalAuth, rec.getRecommendations);

module.exports = router;
