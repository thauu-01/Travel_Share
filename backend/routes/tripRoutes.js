const router = require('express').Router();
const trip = require('../controllers/TripController');
const { authenticate, optionalAuth, auth } = require('../middlewares/auth');

const authMiddleware = authenticate || auth;

router.get('/my-trips', authMiddleware, trip.getMyTrips);
router.get('/', authMiddleware, trip.getAll);
router.get('/:id', optionalAuth, trip.getById);
router.get('/:id/days', optionalAuth, trip.getDays);
router.post('/', authMiddleware, trip.create);
router.put('/:id', authMiddleware, trip.update);
router.delete('/:id', authMiddleware, trip.delete);

router.post('/generate-ai', authMiddleware, trip.generateAITrip);

router.post('/:id/days', authMiddleware, trip.addDay);
router.patch('/:id/days/:dayId', authMiddleware, trip.updateDay);
router.delete('/:id/days/:dayId', authMiddleware, trip.deleteDay);

router.post('/:tripId/days/:dayId/places', authMiddleware, trip.addPlaceToDay);
router.patch('/:tripId/days/:dayId/places/:tripPlaceId', authMiddleware, trip.updatePlaceInDay);
router.delete('/:tripId/days/:dayId/places/:placeId', authMiddleware, trip.removePlaceFromDay);

module.exports = router;

