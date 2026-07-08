const router = require('express').Router();
const trip = require('../controllers/TripController');
const { authenticate, optionalAuth } = require('../middlewares/auth');

router.get('/', authenticate, trip.getAll);
router.get('/:id', optionalAuth, trip.getById);
router.post('/', authenticate, trip.create);
router.put('/:id', authenticate, trip.update);
router.delete('/:id', authenticate, trip.delete);
router.post('/:id/days', authenticate, trip.addDay);
router.post('/:tripId/days/:dayId/places', authenticate, trip.addPlaceToDay);

module.exports = router;
