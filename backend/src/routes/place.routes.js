import express from 'express';
const router = express.Router();
import placeController from '../controllers/place.controller.js';
import adminController from '../controllers/admin.controller.js';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware.js';
import { uploadPlaceSingle, handleUploadError } from '../middlewares/upload.middleware.js';
import { validateCreatePlace } from '../validators/place.validator.js';

// Public/User routes
router.get('/', placeController.getAll);
router.get('/provinces', placeController.getProvinces);
router.get('/:id', placeController.getById);
router.post(
  '/',
  authenticate,
  uploadPlaceSingle,
  handleUploadError,
  validateCreatePlace,
  placeController.create
);

// Admin place management routes
router.post('/admin/create', authenticate, requireAdmin, uploadPlaceSingle, handleUploadError, adminController.createPlace);

export default router;
