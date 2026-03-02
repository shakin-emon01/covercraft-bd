import { Router } from 'express';
import { createReview, getReviews } from '../controllers/review.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getReviews);
router.post('/', authenticate, createReview);

export default router;
