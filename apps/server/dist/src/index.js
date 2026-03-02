"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_rate_limit_1 = __importStar(require("express-rate-limit"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const security_routes_1 = __importDefault(require("./routes/security.routes"));
const university_routes_1 = __importDefault(require("./routes/university.routes"));
const profile_routes_1 = __importDefault(require("./routes/profile.routes"));
const cover_routes_1 = __importDefault(require("./routes/cover.routes"));
const template_routes_1 = __importDefault(require("./routes/template.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const system_routes_1 = __importDefault(require("./routes/system.routes"));
const review_routes_1 = __importDefault(require("./routes/review.routes"));
const security_middleware_1 = require("./middleware/security.middleware");
const prisma_1 = __importDefault(require("./lib/prisma"));
const uploads_1 = require("./lib/uploads");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const normalizeOrigin = (value) => value.trim().replace(/\/+$/, '');
const parseOriginList = (...values) => values
    .flatMap((entry) => String(entry ?? '').split(','))
    .map((item) => normalizeOrigin(item))
    .filter(Boolean);
const getOriginHostname = (origin) => {
    try {
        return new URL(origin).hostname.toLowerCase();
    }
    catch {
        return '';
    }
};
const trustProxyRaw = String(process.env.TRUST_PROXY ?? '1').trim().toLowerCase();
const resolvedTrustProxy = trustProxyRaw === 'true'
    ? true
    : trustProxyRaw === 'false'
        ? false
        : Number.isNaN(Number(trustProxyRaw))
            ? 1
            : Number(trustProxyRaw);
app.set('trust proxy', resolvedTrustProxy);
// 1. Security Headers (Helmet)
app.use((0, helmet_1.default)({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));
// 2. CORS & Body Parser
const allowVercelOrigins = String(process.env.ALLOW_VERCEL_ORIGINS ?? 'true').trim().toLowerCase() !== 'false';
const allowedOrigins = new Set(parseOriginList(process.env.CLIENT_URL, process.env.CLIENT_ORIGINS, 'http://localhost:5173', 'http://localhost:4173', 'https://covercraftbd.vercel.app'));
const allowAllOrigins = String(process.env.CORS_ALLOW_ALL ?? '').trim().toLowerCase() === 'true' || allowedOrigins.size === 0;
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        const normalizedOrigin = normalizeOrigin(origin);
        if (allowAllOrigins || allowedOrigins.has(normalizedOrigin)) {
            return callback(null, true);
        }
        const hostname = getOriginHostname(normalizedOrigin);
        if (allowVercelOrigins && hostname.endsWith('.vercel.app')) {
            return callback(null, true);
        }
        return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
};
app.use((0, cors_1.default)(corsOptions));
app.options('*', (0, cors_1.default)(corsOptions));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ limit: '10mb', extended: true }));
// 3. Security Middleware
app.use(security_middleware_1.checkTokenBlacklist);
// 4. Rate Limiters (Abuse Protection)
const extractUserIdFromBearerToken = (authorizationHeader) => {
    if (typeof authorizationHeader !== 'string')
        return null;
    const [scheme, token] = authorizationHeader.split(' ');
    if (scheme !== 'Bearer' || !token || !process.env.JWT_SECRET)
        return null;
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        return typeof decoded?.userId === 'string' ? decoded.userId : null;
    }
    catch {
        return null;
    }
};
const buildRateLimitKey = (req) => {
    const userId = extractUserIdFromBearerToken(req.headers.authorization);
    if (userId)
        return `user:${userId}`;
    const forwardedFor = String(req.headers['x-forwarded-for'] ?? '').split(',')[0]?.trim();
    const rawIp = forwardedFor || req.ip || req.socket.remoteAddress || '';
    return `ip:${(0, express_rate_limit_1.ipKeyGenerator)(rawIp)}`;
};
const rateLimitHandler = (req, res) => {
    const resetTime = req?.rateLimit?.resetTime;
    const resetSeconds = Math.ceil(Math.max(((resetTime instanceof Date ? resetTime.getTime() : Date.now()) - Date.now()), 0) / 1000);
    res.status(429).json({
        message: 'Too many requests. Please try again shortly.',
        retryAfter: resetSeconds,
    });
};
const globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 1200,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator: buildRateLimitKey,
    handler: rateLimitHandler,
    validate: { xForwardedForHeader: false },
    skip: (req) => req.path.startsWith('/admin'),
});
const adminLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 2400,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator: buildRateLimitKey,
    handler: rateLimitHandler,
    validate: { xForwardedForHeader: false },
});
const exportLimiter = (0, express_rate_limit_1.default)({
    windowMs: 10 * 60 * 1000,
    max: 60,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator: buildRateLimitKey,
    handler: (_req, res) => {
        return res.status(429).json({
            message: 'Export limit reached. Please wait a few minutes to generate more covers.',
        });
    },
    validate: { xForwardedForHeader: false },
});
// Apply global limiter to all routes
app.use('/api', globalLimiter);
// Dedicated limiter for admin dashboard APIs (high volume, authenticated)
app.use('/api/admin', adminLimiter);
// Apply strict limiter to heavy export routes
app.use('/api/covers/generate', exportLimiter);
app.use('/api/covers/:id/download', exportLimiter);
// 5. Static Uploads Folder
app.use('/uploads', express_1.default.static((0, uploads_1.getUploadsRoot)()));
// 6. Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/security', security_routes_1.default);
app.use('/api/universities', university_routes_1.default);
app.use('/api/templates', template_routes_1.default);
app.use('/api/profile', profile_routes_1.default);
app.use('/api/covers', cover_routes_1.default);
app.use('/api/reviews', review_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/system', system_routes_1.default);
app.listen(PORT, async () => {
    console.log('⏳ Starting server and checking database connection...');
    try {
        await prisma_1.default.$queryRaw `SELECT 1`;
        console.log('✅ Database connected successfully!');
        console.log(`🚀 Server is running on port ${PORT}`);
    }
    catch (err) {
        console.error('❌ FATAL: Database connection failed:', err);
        process.exit(1);
    }
});
const shutdown = async (signal) => {
    console.log(`\n⚠️ ${signal} signal received. Shutting down gracefully...`);
    try {
        await prisma_1.default.$disconnect();
        console.log('✅ Database disconnected successfully.');
        process.exit(0);
    }
    catch (err) {
        console.error('❌ Error during shutdown:', err);
        process.exit(1);
    }
};
process.on('SIGINT', () => {
    void shutdown('SIGINT');
});
process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
});
exports.default = app;
