import { Router, type Router as RouterType } from 'express';
import {
  sendEmailVerificationCode,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  refreshToken,
  logout,
  getActiveSessions,
  revokeSession,
  revokeAllOtherSessions,
  generateSignedDownloadUrl,
  downloadWithSignedUrl,
} from '../controllers/security.controller';
import { authenticate } from '../middleware/auth.middleware';
import { createRateLimiter, verifyRecaptcha, wafProtection } from '../middleware/waf.middleware';

const router: RouterType = Router();

// ==================== EMAIL VERIFICATION ====================
router.post('/send-verification-code', authenticate, sendEmailVerificationCode);
router.post('/verify-email', authenticate, verifyEmail);

// ==================== PASSWORD RESET ====================
router.post(
  '/request-password-reset',
  wafProtection,
  createRateLimiter(15 * 60 * 1000, 3), // 3 attempts per 15 minutes
  requestPasswordReset
);

router.post(
  '/reset-password',
  wafProtection,
  createRateLimiter(15 * 60 * 1000, 3),
  resetPassword
);

// ==================== TOKEN MANAGEMENT ====================
router.post('/refresh-token', refreshToken);
router.post('/logout', authenticate, logout);

// ==================== SESSION MANAGEMENT ====================
router.get('/sessions', authenticate, getActiveSessions);
router.delete('/sessions/:sessionId', authenticate, revokeSession);
router.post('/sessions/revoke-others', authenticate, revokeAllOtherSessions);

// ==================== SIGNED URLS ====================
router.post('/generate-signed-url', authenticate, generateSignedDownloadUrl);
router.get('/download/:signature', downloadWithSignedUrl);

export default router;
