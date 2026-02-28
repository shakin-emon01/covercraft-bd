"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const waf_middleware_1 = require("../middleware/waf.middleware");
const router = (0, express_1.Router)();
/**
 * Register - with rate limiting, WAF, and optional captcha
 */
router.post('/register', waf_middleware_1.wafProtection, (0, waf_middleware_1.createRateLimiter)(15 * 60 * 1000, 5), // 5 attempts per 15 minutes
auth_controller_1.register);
/**
 * Login - with rate limiting, WAF, and optional captcha
 */
router.post('/login', waf_middleware_1.wafProtection, (0, waf_middleware_1.createRateLimiter)(15 * 60 * 1000, 5), auth_controller_1.login);
/**
 * Google OAuth Callback
 */
router.post('/google', auth_controller_1.googleCallback);
/**
 * Get Current User
 */
router.get('/me', auth_middleware_1.authenticate, auth_controller_1.getMe);
exports.default = router;
