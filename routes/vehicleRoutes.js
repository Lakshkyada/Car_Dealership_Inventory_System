import express from 'express';
import { createVehicle } from '../controllers/vehicleController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createVehicle);

export default router;
