import express from 'express';

import authRoutes from './auth.routes.js';
import postRoutes from './post.routes.js';
import commentRoutes from './comment.routes.js';
import placeRoutes from './place.routes.js';
import tripRoutes from './trip.routes.js';
import notificationRoutes from './notification.routes.js';
import userRoutes from './user.routes.js';
import categoryRoutes from './category.routes.js';
import recommendationRoutes from './recommendation.routes.js';
import chatRoutes from './chat.routes.js';
import reportRoutes from './report.routes.js';
import paymentRoutes from './payment.routes.js';
import statsRoutes from './stats.routes.js';
import adminRoutes from './admin.routes.js';

import { globalLimiter, authLimiter, chatLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = express.Router();

// Áp dụng global limiter cho toàn bộ /api
router.use(globalLimiter);

// Module routes
router.use('/auth', authLimiter, authRoutes);
router.use('/posts', postRoutes);
router.use('/posts/:postId/comments', commentRoutes);
router.use('/comments', commentRoutes);
router.use('/places', placeRoutes);
router.use('/trips', tripRoutes);
router.use('/notifications', notificationRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/chat', chatLimiter, chatRoutes);
router.use('/reports', reportRoutes);
router.use('/payment', paymentRoutes);
router.use('/stats', statsRoutes);
router.use('/admin', adminRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    message: 'TravelShare API',
    version: '2.0.0',
    status: 'running',
    timestamp: new Date()
  });
});

export default router;
