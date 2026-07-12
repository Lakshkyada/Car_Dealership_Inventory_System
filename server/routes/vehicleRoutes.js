import express from 'express';
import { createVehicle, getVehicles, updateVehicle, deleteVehicle, searchVehicles, purchaseVehicle, restockVehicle } from '../controllers/vehicleController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload, { handleUploadError } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/', protect, upload.single('image'), handleUploadError, createVehicle);
router.get('/', protect, getVehicles);
router.get('/search', protect, searchVehicles);
router.put('/:id', protect, upload.single('image'), handleUploadError, updateVehicle);
router.delete('/:id', protect, deleteVehicle);
router.post('/:id/purchase', protect, purchaseVehicle);
router.post('/:id/restock', protect, restockVehicle);

export default router;


