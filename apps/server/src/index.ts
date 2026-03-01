import express, { type Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

import authRoutes from './routes/auth.routes';
import securityRoutes from './routes/security.routes';
import universityRoutes from './routes/university.routes';
import profileRoutes from './routes/profile.routes';
import coverRoutes from './routes/cover.routes';
import templateRoutes from './routes/template.routes';
import adminRoutes from './routes/admin.routes';
import systemRoutes from './routes/system.routes';
import { checkTokenBlacklist } from './middleware/security.middleware';
import prisma from './lib/prisma';
import { getUploadsRoot } from './lib/uploads';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

const trustProxyRaw = String(process.env.TRUST_PROXY ?? '1').trim().toLowerCase();
const resolvedTrustProxy: boolean | number =
  trustProxyRaw === 'true'
    ? true
    : trustProxyRaw === 'false'
      ? false
      : Number.isNaN(Number(trustProxyRaw))
        ? 1
        : Number(trustProxyRaw);
app.set('trust proxy', resolvedTrustProxy);

// 1. Security Headers (Helmet)
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// 2. CORS & Body Parser
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 3. Security Middleware
app.use(checkTokenBlacklist);

// 4. Rate Limiters (Abuse Protection)
const extractUserIdFromBearerToken = (authorizationHeader: unknown): string | null => {
  if (typeof authorizationHeader !== 'string') return null;
  const [scheme, token] = authorizationHeader.split(' ');
  if (scheme !== 'Bearer' || !token || !process.env.JWT_SECRET) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId?: unknown };
    return typeof decoded?.userId === 'string' ? decoded.userId : null;
  } catch {
    return null;
  }
};

const buildRateLimitKey = (req: express.Request) => {
  const userId = extractUserIdFromBearerToken(req.headers.authorization);
  if (userId) return `user:${userId}`;

  const forwardedFor = String(req.headers['x-forwarded-for'] ?? '').split(',')[0]?.trim();
  const rawIp = forwardedFor || req.ip || req.socket.remoteAddress || '';
  return `ip:${ipKeyGenerator(rawIp)}`;
};

const rateLimitHandler = (req: express.Request, res: express.Response) => {
  const resetTime = (req as any)?.rateLimit?.resetTime;
  const resetSeconds = Math.ceil(Math.max(((resetTime instanceof Date ? resetTime.getTime() : Date.now()) - Date.now()), 0) / 1000);
  res.status(429).json({
    message: 'Too many requests. Please try again shortly.',
    retryAfter: resetSeconds,
  });
};

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1200,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: buildRateLimitKey,
  handler: rateLimitHandler,
  validate: { xForwardedForHeader: false },
  skip: (req) => req.path.startsWith('/admin'),
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2400,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: buildRateLimitKey,
  handler: rateLimitHandler,
  validate: { xForwardedForHeader: false },
});

const exportLimiter = rateLimit({
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
app.use('/uploads', express.static(getUploadsRoot()));

// 6. Routes
app.use('/api/auth', authRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/covers', coverRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/system', systemRoutes);

app.listen(PORT, async () => {
  console.log('⏳ Starting server and checking database connection...');

  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connected successfully!');
    console.log(`🚀 Server is running on port ${PORT}`);
  } catch (err) {
    console.error('❌ FATAL: Database connection failed:', err);
    process.exit(1);
  }
});

const shutdown = async (signal: string) => {
  console.log(`\n⚠️ ${signal} signal received. Shutting down gracefully...`);
  try {
    await prisma.$disconnect();
    console.log('✅ Database disconnected successfully.');
    process.exit(0);
  } catch (err) {
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

export default app;
