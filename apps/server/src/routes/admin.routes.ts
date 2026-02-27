import { Router } from 'express';
import {
  getAdminStats,
  getAdminUsers,
  getAdminCovers,
  updateUniversityByAdmin,
  syncUniversitiesByAdmin,
} from '../controllers/admin.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/stats', getAdminStats);
router.get('/users', getAdminUsers);
router.get('/covers', getAdminCovers);
router.put('/universities/:id', updateUniversityByAdmin);
router.post('/universities/sync', syncUniversitiesByAdmin);

export default router;
