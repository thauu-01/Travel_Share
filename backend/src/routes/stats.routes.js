import express from 'express';
const router = express.Router();
import adminController from '../controllers/admin.controller.js';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware.js';

router.get('/dashboard', authenticate, requireAdmin, adminController.getDashboard);

export default router;
