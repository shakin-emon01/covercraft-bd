import { Router, type Router as RouterType } from 'express';
import { register, login, googleCallback, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { createRateLimiter, wafProtection } from '../middleware/waf.middleware';

const router: RouterType = Router();

/**
 * Register - with rate limiting, WAF, and optional captcha
 */
router.post(
  '/register',
  wafProtection,
  createRateLimiter(15 * 60 * 1000, 5), // 5 attempts per 15 minutes
  register
);

/**
 * Login - with rate limiting, WAF, and optional captcha
 */
router.post(
 '/login',
  wafProtection,
  createRateLimiter(15 * 60 * 1000, 5),
  login
);

/**
 * Google OAuth Callback
 */
router.post('/google', googleCallback);

/**
 * Get Current User
 */
router.get('/me', authenticate, getMe);

export default router;
