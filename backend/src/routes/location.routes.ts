import { Router } from 'express';
import {
  createLocation,
  getLocations,
  updateLocation,
  deleteLocation,
} from '../controllers/location.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

router.get('/', authenticate, getLocations);
router.post('/', authenticate, authorize('admin'), createLocation);
router.put('/:id', authenticate, authorize('admin'), updateLocation);
router.delete('/:id', authenticate, authorize('admin'), deleteLocation);

export default router;