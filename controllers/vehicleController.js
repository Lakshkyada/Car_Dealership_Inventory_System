import Vehicle from '../models/vehicleModel.js';

// @desc    Create a new vehicle
// @route   POST /api/vehicles
// @access  Private (authenticated users)
export const createVehicle = async (req, res) => {
  try {
    const { make, model, category, price, quantity } = req.body;

    // Validate required fields
    if (
      make === undefined ||
      make === null ||
      make === '' ||
      model === undefined ||
      model === null ||
      model === '' ||
      category === undefined ||
      category === null ||
      category === '' ||
      price === undefined ||
      price === null ||
      quantity === undefined ||
      quantity === null
    ) {
      return res.status(400).json({
        message: 'make, model, category, price, and quantity are required',
      });
    }

    // Validate non-negative numeric constraints before hitting the DB
    if (price < 0) {
      return res.status(400).json({ message: 'Price must be a non-negative number' });
    }

    if (quantity < 0) {
      return res.status(400).json({ message: 'Quantity must be a non-negative number' });
    }

    const vehicle = await Vehicle.create({ make, model, category, price, quantity });

    return res.status(201).json({
      _id: vehicle._id,
      make: vehicle.make,
      model: vehicle.model,
      category: vehicle.category,
      price: vehicle.price,
      quantity: vehicle.quantity,
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt,
    });
  } catch (error) {
    // Mongoose validation errors → 400
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors)
        .map((e) => e.message)
        .join(', ');
      return res.status(400).json({ message });
    }

    return res.status(500).json({ message: error.message });
  }
};
