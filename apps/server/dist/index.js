import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
export default app;
//# sourceMappingURL=index.js.map