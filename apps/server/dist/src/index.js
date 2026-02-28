"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const security_routes_1 = __importDefault(require("./routes/security.routes"));
const university_routes_1 = __importDefault(require("./routes/university.routes"));
const profile_routes_1 = __importDefault(require("./routes/profile.routes"));
const cover_routes_1 = __importDefault(require("./routes/cover.routes"));
const template_routes_1 = __importDefault(require("./routes/template.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const system_routes_1 = __importDefault(require("./routes/system.routes"));
const security_middleware_1 = require("./middleware/security.middleware");
const prisma_1 = __importDefault(require("./lib/prisma"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// 1. Security Headers (Helmet)
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
        },
    },
    crossOriginResourcePolicy: false,
    hsts: { maxAge: 31536000, includeSubDomains: true },
}));
// 2. CORS & Body Parser
app.use((0, cors_1.default)({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ limit: '10mb', extended: true }));
// 3. Security Middleware
app.use(security_middleware_1.checkTokenBlacklist);
// 4. Rate Limiters (Abuse Protection)
const globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: { message: 'Too many requests from this IP, please try again later.' },
});
const exportLimiter = (0, express_rate_limit_1.default)({
    windowMs: 10 * 60 * 1000,
    max: 30,
    message: { message: 'Export limit reached. Please wait a few minutes to generate more covers.' },
});
// Apply global limiter to all routes
app.use('/api', globalLimiter);
// Apply strict limiter to heavy export routes
app.use('/api/covers/generate', exportLimiter);
app.use('/api/covers/:id/download', exportLimiter);
// 5. Static Uploads Folder
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
// 6. Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/security', security_routes_1.default);
app.use('/api/universities', university_routes_1.default);
app.use('/api/templates', template_routes_1.default);
app.use('/api/profile', profile_routes_1.default);
app.use('/api/covers', cover_routes_1.default);
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
