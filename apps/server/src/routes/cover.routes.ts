// apps/server/src/routes/cover.routes.ts
import { Router } from 'express';
import {
  getUserCovers,
  createCover,
  generateCover,
  getCoverDownloadInfo,
  deleteCover,
  getSharedCover,
  generateBatchCovers,
} from '../controllers/cover.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public route for shared covers (before authentication middleware)
router.get('/shared/:id', getSharedCover);

router.get('/', authenticate, getUserCovers);
router.get('/:id/download', authenticate, getCoverDownloadInfo);
router.post('/generate', authenticate, generateCover);
router.post('/batch', authenticate, generateBatchCovers);
router.post('/', authenticate, createCover);
router.delete('/:id', authenticate, deleteCover);

export default router;
