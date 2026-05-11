import { Router } from 'express';
import { lock, release } from '../controllers/seat.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.post('/lock', authenticate, lock);
router.post('/release', authenticate, release);

export default router;