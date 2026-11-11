import express from 'express';
const router = express.Router();
import tripController from '../controllers/trip.controller.js';
import { authenticate, optionalAuth } from '../middlewares/auth.middleware.js';
import { validateCreateTrip, validateAddPlaceToDay } from '../validators/trip.validator.js';

router.get('/my-trips', authenticate, tripController.getMyTrips);
router.get('/', authenticate, tripController.getAll);
router.get('/:id', optionalAuth, tripController.getById);
router.post('/', authenticate, validateCreateTrip, tripController.create);
router.put('/:id', authenticate, tripController.update);
router.delete('/:id', authenticate, tripController.delete);

router.post('/generate-ai', authenticate, tripController.autoGenerateAI);

router.post('/:id/days', authenticate, tripController.addDay);
router.post('/:tripId/days/:dayId/places', authenticate, validateAddPlaceToDay, tripController.addPlaceToDay);
router.delete('/:tripId/days/:dayId/places/:placeId', authenticate, tripController.removePlaceFromDay);

export default router;
