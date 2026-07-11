import express from 'express';
import { createVehicle, getVehicles } from '../controllers/vehicleController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createVehicle);
router.get('/', protect, getVehicles);

export default router;
