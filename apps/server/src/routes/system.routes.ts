import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { createSupportTicket, getActiveBroadcast, getPublicFeatureFlags } from '../controllers/admin.controller';

const router = Router();

router.get('/broadcast', getActiveBroadcast);
router.get('/flags', getPublicFeatureFlags);
router.post('/support/tickets', authenticate, createSupportTicket);

export default router;
