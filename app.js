import express from 'express';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';

const app = express();

app.use(express.json());

app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);

export default app;
