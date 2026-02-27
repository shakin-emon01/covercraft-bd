import express, { type Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import universityRoutes from './routes/university.routes';
import profileRoutes from './routes/profile.routes';
import coverRoutes from './routes/cover.routes';
import templateRoutes from './routes/template.routes';
import adminRoutes from './routes/admin.routes';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/covers', coverRoutes);
app.use('/api/admin', adminRoutes);

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

export default app;
