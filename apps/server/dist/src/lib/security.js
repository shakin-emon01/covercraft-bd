"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractDeviceName = exports.verifySignedUrl = exports.generateSignedUrl = exports.verifyRefreshToken = exports.generateRefreshToken = exports.hashToken = exports.generateRandomToken = exports.generateOTP = void 0;
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Generate a random OTP (One-Time Password)
 */
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
exports.generateOTP = generateOTP;
/**
 * Generate a random token (for password reset, email verification)
 */
const generateRandomToken = () => {
    return crypto_1.default.randomBytes(32).toString('hex');
};
exports.generateRandomToken = generateRandomToken;
/**
 * Hash a token using SHA-256
 */
const hashToken = (token) => {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
};
exports.hashToken = hashToken;
/**
 * Generate a refresh token (JWT-style but different secret)
 */
const generateRefreshToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId, type: 'refresh' }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: '30d',
    });
};
exports.generateRefreshToken = generateRefreshToken;
/**
 * Verify a refresh token
 */
const verifyRefreshToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, process.env.REFRESH_TOKEN_SECRET);
    }
    catch {
        return null;
    }
};
exports.verifyRefreshToken = verifyRefreshToken;
/**
 * Generate a signed URL with expiry
 */
const generateSignedUrl = (filePath, expiryInMinutes = 30) => {
    const signature = crypto_1.default.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + expiryInMinutes * 60 * 1000;
    const payload = `${filePath}|${expiresAt}|${signature}`;
    return Buffer.from(payload).toString('base64');
};
exports.generateSignedUrl = generateSignedUrl;
/**
 * Verify a signed URL
 */
const verifySignedUrl = (signedUrl) => {
    try {
        const payload = Buffer.from(signedUrl, 'base64').toString('utf-8');
        const [filePath, expiresAt] = payload.split('|');
        const expiryTime = parseInt(expiresAt, 10);
        if (Date.now() > expiryTime) {
            return null; // URL expired
        }
        return { filePath, expiresAt: expiryTime };
    }
    catch {
        return null;
    }
};
exports.verifySignedUrl = verifySignedUrl;
/**
 * Extract device name from User-Agent
 */
const extractDeviceName = (userAgent) => {
    if (!userAgent)
        return 'Unknown Device';
    if (userAgent.includes('Mobile'))
        return 'Mobile';
    if (userAgent.includes('iPad'))
        return 'iPad';
    if (userAgent.includes('Mac'))
        return 'Mac';
    if (userAgent.includes('Windows'))
        return 'Windows';
    if (userAgent.includes('Linux'))
        return 'Linux';
    return 'Unknown Device';
};
exports.extractDeviceName = extractDeviceName;
