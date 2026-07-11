import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';

const app = express();

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',');
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
  })
);
app.use(express.json());

// Routes
// Health Check: GET /health
app.use('/health', healthRoutes);

// Authentication API: POST /api/auth/register, POST /api/auth/login
app.use('/api/auth', authRoutes);

// Vehicles API:
// - GET /api/vehicles
// - POST /api/vehicles
// - GET /api/vehicles/search
// - PUT /api/vehicles/:id
// - DELETE /api/vehicles/:id
// - POST /api/vehicles/:id/purchase
// - POST /api/vehicles/:id/restock
app.use('/api/vehicles', vehicleRoutes);

export default app;

