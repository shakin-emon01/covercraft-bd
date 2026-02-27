// apps/server/src/routes/cover.routes.ts
import { Router } from 'express';
import {
  getUserCovers,
  createCover,
  generateCover,
  getCoverDownloadInfo,
  deleteCover,
} from '../controllers/cover.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getUserCovers);
router.get('/:id/download', authenticate, getCoverDownloadInfo);
router.post('/generate', authenticate, generateCover);
router.post('/', authenticate, createCover);
router.delete('/:id', authenticate, deleteCover);

export default router;
