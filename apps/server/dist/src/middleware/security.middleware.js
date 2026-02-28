"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkTokenBlacklist = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
// Short-lived cache to reduce database pressure on repeated revoked-token checks.
const BLACKLIST_CACHE = new Map();
const CACHE_TTL_MS = 60 * 1000;
const getBearerToken = (authorizationHeader) => {
    if (!authorizationHeader)
        return '';
    const [scheme, value] = authorizationHeader.split(' ');
    if (scheme !== 'Bearer' || !value)
        return '';
    return value.trim();
};
const checkTokenBlacklist = async (req, res, next) => {
    const token = getBearerToken(req.headers.authorization);
    if (!token)
        return next();
    const now = Date.now();
    const cachedUntil = BLACKLIST_CACHE.get(token);
    if (cachedUntil && cachedUntil > now) {
        return res.status(401).json({ message: 'Token has been revoked. Please login again.' });
    }
    if (cachedUntil && cachedUntil <= now) {
        BLACKLIST_CACHE.delete(token);
    }
    try {
        const isBlacklisted = await prisma_1.default.tokenBlacklist.findUnique({
            where: { token },
        });
        if (isBlacklisted) {
            BLACKLIST_CACHE.set(token, now + CACHE_TTL_MS);
            return res.status(401).json({ message: 'Token has been revoked. Please login again.' });
        }
    }
    catch (err) {
        console.error('Blacklist check failed:', err);
    }
    return next();
};
exports.checkTokenBlacklist = checkTokenBlacklist;
