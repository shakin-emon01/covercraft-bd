import { Router } from 'express';
import { getProfile, upsertProfile } from '../controllers/profile.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getProfile);
router.put('/', authenticate, upsertProfile);

export default router;
