import express from 'express';
const router = express.Router();
import categoryController from '../controllers/category.controller.js';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware.js';

router.get('/', categoryController.getAll);
router.post('/', authenticate, requireAdmin, categoryController.create);
router.put('/:id', authenticate, requireAdmin, categoryController.update);
router.delete('/:id', authenticate, requireAdmin, categoryController.delete);

export default router;
