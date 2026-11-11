import express from 'express';
const router = express.Router();
import userController from '../controllers/user.controller.js';
import adminController from '../controllers/admin.controller.js';
import { authenticate, optionalAuth, requireAdmin } from '../middlewares/auth.middleware.js';
import { uploadSingle, handleUploadError } from '../middlewares/upload.middleware.js';

// Admin user management routes
router.get('/', authenticate, requireAdmin, adminController.getUsers);
router.patch('/:id/ban', authenticate, requireAdmin, adminController.banUser);
router.patch('/:id/unban', authenticate, requireAdmin, adminController.unbanUser);
router.patch('/:id/role', authenticate, requireAdmin, adminController.changeRole);
router.delete('/:id', authenticate, requireAdmin, adminController.deleteUser);

// Regular user routes
router.get('/liked-posts', authenticate, userController.getLikedPosts);
router.get('/:id', userController.getProfile);
router.put('/profile', authenticate, uploadSingle, handleUploadError, userController.updateProfile);
router.get('/:id/posts', optionalAuth, userController.getUserPosts);

export default router;
