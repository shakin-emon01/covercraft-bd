import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getAllUniversities, getUniversityById, submitLogoRequest } from '../controllers/university.controller';

const router = Router();

router.get('/', getAllUniversities);
router.get('/:id', getUniversityById);
router.post('/:id/logo-request', authenticate, submitLogoRequest);

export default router;
