import express, { type Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';

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

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);

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
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { message: 'Too many requests from this IP, please try again later.' },
});

const exportLimiter = rateLimit({
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
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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
