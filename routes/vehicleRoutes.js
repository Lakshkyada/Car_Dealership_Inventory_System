import express from 'express';
import { createVehicle, getVehicles, updateVehicle, deleteVehicle, searchVehicles } from '../controllers/vehicleController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createVehicle);
router.get('/', protect, getVehicles);
router.get('/search', protect, searchVehicles);
router.put('/:id', protect, updateVehicle);
router.delete('/:id', protect, authorize('ADMIN'), deleteVehicle);

export default router;
