import express from 'express';
import { createVehicle, getVehicles, updateVehicle } from '../controllers/vehicleController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createVehicle);
router.get('/', protect, getVehicles);
router.put('/:id', protect, updateVehicle);

export default router;
