import { Router, type Router as RouterType } from 'express';
import { register, login, googleCallback, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router: RouterType = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleCallback);
router.get('/me', authenticate, getMe);

export default router;
