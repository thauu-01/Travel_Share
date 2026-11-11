import express from 'express';
const router = express.Router();
import reportController from '../controllers/report.controller.js';
import adminController from '../controllers/admin.controller.js';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware.js';
import { createContentLimiter } from '../middlewares/rateLimiter.middleware.js';
import { validateCreateReport } from '../validators/report.validator.js';

// Admin routes
router.get('/', authenticate, requireAdmin, adminController.getReports);
router.patch('/:id', authenticate, requireAdmin, adminController.updateReport);

// User report route
router.post('/', authenticate, createContentLimiter, validateCreateReport, reportController.create);

export default router;
