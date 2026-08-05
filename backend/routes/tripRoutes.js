const router = require('express').Router();
const trip = require('../controllers/TripController');
const { authenticate, optionalAuth } = require('../middlewares/auth');

router.get('/my-trips', authenticate, trip.getMyTrips);
router.get('/', authenticate, trip.getAll);
router.get('/:id', optionalAuth, trip.getById);
router.get('/:id/days', optionalAuth, trip.getDays);
router.post('/', authenticate, trip.create);
router.put('/:id', authenticate, trip.update);
router.delete('/:id', authenticate, trip.delete);

router.post('/:id/days', authenticate, trip.addDay);
router.patch('/:id/days/:dayId', authenticate, trip.updateDay);
router.delete('/:id/days/:dayId', authenticate, trip.deleteDay);

router.post('/:tripId/days/:dayId/places', authenticate, trip.addPlaceToDay);
router.delete('/:tripId/days/:dayId/places/:placeId', authenticate, trip.removePlaceFromDay);

module.exports = router;
