"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupRateLimiter = exports.wafProtection = exports.verifyHcaptcha = exports.verifyRecaptcha = exports.createRateLimiter = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * Simple in-memory rate limiter
 * Map: "ip:endpoint" -> { count, resetTime }
 */
const rateLimitStore = new Map();
/**
 * Rate limiting middleware for auth endpoints
 * @param windowMs - Time window in milliseconds
 * @param maxRequests - Maximum requests per window
 */
const createRateLimiter = (windowMs = 15 * 60 * 1000, maxRequests = 5) => {
    return (req, res, next) => {
        const key = `${req.ip}:${req.path}`;
        const now = Date.now();
        const record = rateLimitStore.get(key);
        if (record && now < record.resetTime) {
            record.count++;
            if (record.count > maxRequests) {
                return res.status(429).json({
                    message: 'Too many attempts. Please try again later.',
                    retryAfter: Math.ceil((record.resetTime - now) / 1000),
                });
            }
        }
        else {
            rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
        }
        next();
    };
};
exports.createRateLimiter = createRateLimiter;
/**
 * Verify reCAPTCHA token
 */
const verifyRecaptcha = async (req, res, next) => {
    const { captchaToken } = req.body;
    if (!captchaToken) {
        return res.status(400).json({ message: 'Captcha token is required' });
    }
    try {
        const response = await axios_1.default.post(`https://www.google.com/recaptcha/api/siteverify`, null, {
            params: {
                secret: process.env.RECAPTCHA_SECRET_KEY,
                response: captchaToken,
            },
        });
        const { success, score } = response.data;
        // For v3, score should be > 0.5
        if (!success || (score && score < 0.5)) {
            return res.status(400).json({ message: 'Captcha verification failed' });
        }
        next();
    }
    catch (err) {
        console.error('Captcha verification error:', err.message);
        return res.status(500).json({ message: 'Captcha verification error' });
    }
};
exports.verifyRecaptcha = verifyRecaptcha;
/**
 * Hcaptcha verification
 */
const verifyHcaptcha = async (req, res, next) => {
    const { captchaToken } = req.body;
    if (!captchaToken) {
        return res.status(400).json({ message: 'Captcha token is required' });
    }
    try {
        const response = await axios_1.default.post(`https://hcaptcha.com/siteverify`, null, {
            params: {
                secret: process.env.HCAPTCHA_SECRET,
                response: captchaToken,
            },
        });
        const { success } = response.data;
        if (!success) {
            return res.status(400).json({ message: 'Captcha verification failed' });
        }
        next();
    }
    catch (err) {
        console.error('Hcaptcha verification error:', err.message);
        return res.status(500).json({ message: 'Captcha verification error' });
    }
};
exports.verifyHcaptcha = verifyHcaptcha;
/**
 * WAF - Web Application Firewall simple checks
 * Detects common attack patterns
 */
const wafProtection = (req, res, next) => {
    const suspiciousPatterns = [
        /<[^>]+>/i, // HTML tag injection
        /(\.\.\/|\.\.\\|\.\/|\.\\)/, // Directory traversal
        /\b(script|onload|onerror|eval|javascript:)\b/i, // XSS patterns
        /\b(union\s+select|drop\s+table|insert\s+into|delete\s+from|alter\s+table)\b/i, // SQL injection
    ];
    const collectStringValues = (value, bag = []) => {
        if (typeof value === 'string') {
            bag.push(value);
            return bag;
        }
        if (Array.isArray(value)) {
            for (const item of value)
                collectStringValues(item, bag);
            return bag;
        }
        if (value && typeof value === 'object') {
            for (const item of Object.values(value)) {
                collectStringValues(item, bag);
            }
        }
        return bag;
    };
    // Check string values in request body without matching JSON syntax characters.
    if (req.body && typeof req.body === 'object') {
        const valuesToCheck = collectStringValues(req.body);
        for (const value of valuesToCheck) {
            for (const pattern of suspiciousPatterns) {
                if (pattern.test(value)) {
                    console.warn(`WAF: Suspicious pattern detected in request from ${req.ip}`);
                    return res.status(400).json({ message: 'Invalid request' });
                }
            }
        }
    }
    next();
};
exports.wafProtection = wafProtection;
/**
 * Cleanup rate limit store (run periodically)
 */
const cleanupRateLimiter = () => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
        if (now > record.resetTime) {
            rateLimitStore.delete(key);
        }
    }
};
exports.cleanupRateLimiter = cleanupRateLimiter;
// Run cleanup every 10 minutes
setInterval(exports.cleanupRateLimiter, 10 * 60 * 1000);
