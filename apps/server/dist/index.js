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
const university_routes_1 = __importDefault(require("./routes/university.routes"));
const profile_routes_1 = __importDefault(require("./routes/profile.routes"));
const cover_routes_1 = __importDefault(require("./routes/cover.routes"));
const template_routes_1 = __importDefault(require("./routes/template.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// 1. Security Headers (Helmet)
app.use((0, helmet_1.default)({ crossOriginResourcePolicy: false }));
// 2. CORS & Body Parser
app.use((0, cors_1.default)({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express_1.default.json({ limit: '2mb' }));
// 3. Rate Limiters (Abuse Protection)
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
// 4. Static Uploads Folder
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
// 5. Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/universities', university_routes_1.default);
app.use('/api/templates', template_routes_1.default);
app.use('/api/profile', profile_routes_1.default);
app.use('/api/covers', cover_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.listen(PORT, () => console.log(`🚀 Secure Server running on port ${PORT}`));
exports.default = app;
