import { Router } from 'express';
import {
  createSchedule,
  getSchedules,
  getSchedule,
  getScheduleSeats,
  updateSchedule,
  cancelSchedule,
} from '../controllers/schedule.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

router.get('/', authenticate, getSchedules);
router.get('/:id', authenticate, getSchedule);
router.get('/:id/seats', authenticate, getScheduleSeats);
router.post('/', authenticate, authorize('admin'), createSchedule);
router.put('/:id', authenticate, authorize('admin'), updateSchedule);
router.delete('/:id', authenticate, authorize('admin'), cancelSchedule);

export default router;