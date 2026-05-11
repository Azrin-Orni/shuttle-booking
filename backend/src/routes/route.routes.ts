import { Router } from 'express';
import {
  createRoute,
  getRoutes,
  getRoute,
  updateRoute,
  deleteRoute,
} from '../controllers/route.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

router.get('/', authenticate, getRoutes);
router.get('/:id', authenticate, getRoute);
router.post('/', authenticate, authorize('admin'), createRoute);
router.put('/:id', authenticate, authorize('admin'), updateRoute);
router.delete('/:id', authenticate, authorize('admin'), deleteRoute);

export default router;