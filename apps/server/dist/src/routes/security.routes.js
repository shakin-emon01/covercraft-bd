"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const security_controller_1 = require("../controllers/security.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const waf_middleware_1 = require("../middleware/waf.middleware");
const router = (0, express_1.Router)();
// ==================== EMAIL VERIFICATION ====================
router.post('/send-verification-code', auth_middleware_1.authenticate, security_controller_1.sendEmailVerificationCode);
router.post('/verify-email', auth_middleware_1.authenticate, security_controller_1.verifyEmail);
// ==================== PASSWORD RESET ====================
router.post('/request-password-reset', waf_middleware_1.wafProtection, (0, waf_middleware_1.createRateLimiter)(15 * 60 * 1000, 3), // 3 attempts per 15 minutes
security_controller_1.requestPasswordReset);
router.post('/reset-password', waf_middleware_1.wafProtection, (0, waf_middleware_1.createRateLimiter)(15 * 60 * 1000, 3), security_controller_1.resetPassword);
// ==================== TOKEN MANAGEMENT ====================
router.post('/refresh-token', security_controller_1.refreshToken);
router.post('/logout', auth_middleware_1.authenticate, security_controller_1.logout);
// ==================== SESSION MANAGEMENT ====================
router.get('/sessions', auth_middleware_1.authenticate, security_controller_1.getActiveSessions);
router.delete('/sessions/:sessionId', auth_middleware_1.authenticate, security_controller_1.revokeSession);
router.post('/sessions/revoke-others', auth_middleware_1.authenticate, security_controller_1.revokeAllOtherSessions);
// ==================== SIGNED URLS ====================
router.post('/generate-signed-url', auth_middleware_1.authenticate, security_controller_1.generateSignedDownloadUrl);
router.get('/download/:signature', security_controller_1.downloadWithSignedUrl);
exports.default = router;
