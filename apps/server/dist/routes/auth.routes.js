import { Router } from 'express';
import { register, login, googleCallback, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
const router = Router();
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleCallback);
router.get('/me', authenticate, getMe);
export default router;
//# sourceMappingURL=auth.routes.js.map