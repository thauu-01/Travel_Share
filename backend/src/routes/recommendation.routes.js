import express from 'express';
const router = express.Router();
import recommendationController from '../controllers/recommendation.controller.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';

router.get('/', optionalAuth, recommendationController.getRecommendations);

export default router;
