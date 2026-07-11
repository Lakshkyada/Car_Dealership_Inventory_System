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

// @desc    Get all vehicles
// @route   GET /api/vehicles
// @access  Private (authenticated users)
export const getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort({ createdAt: -1 }).lean();
    return res.status(200).json(vehicles);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Update a vehicle
// @route   PUT /api/vehicles/:id
// @access  Private (authenticated users)
export const updateVehicle = async (req, res) => {
  try {
    const { make, model, category, price, quantity } = req.body;

    // Reject empty body
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: 'Request body must not be empty' });
    }

    // Validate string fields when provided
    if (make !== undefined && make === '') {
      return res.status(400).json({ message: 'make must not be an empty string' });
    }
    if (model !== undefined && model === '') {
      return res.status(400).json({ message: 'model must not be an empty string' });
    }
    if (category !== undefined && category === '') {
      return res.status(400).json({ message: 'category must not be an empty string' });
    }

    // Validate numeric constraints when provided
    if (price !== undefined && price < 0) {
      return res.status(400).json({ message: 'Price must be a non-negative number' });
    }
    if (quantity !== undefined && quantity < 0) {
      return res.status(400).json({ message: 'Quantity must be a non-negative number' });
    }

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { make, model, category, price, quantity },
      { returnDocument: 'after', runValidators: true }
    ).lean();

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    return res.status(200).json(vehicle);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors)
        .map((e) => e.message)
        .join(', ');
      return res.status(400).json({ message });
    }

    return res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private (ADMIN only)
export const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    return res.status(200).json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Search vehicles by make, model, category, and/or price range
// @route   GET /api/vehicles/search
// @access  Private (authenticated users)
export const searchVehicles = async (req, res) => {
  try {
    const { make, model, category, minPrice, maxPrice } = req.query;

    const query = {};

    if (make) query.make = { $regex: new RegExp(`^${make}$`, 'i') };
    if (model) query.model = { $regex: new RegExp(`^${model}$`, 'i') };
    if (category) query.category = { $regex: new RegExp(`^${category}$`, 'i') };

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }

    const vehicles = await Vehicle.find(query).sort({ createdAt: -1 }).lean();
    return res.status(200).json(vehicles);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Purchase a vehicle (decrease quantity by 1)
// @route   POST /api/vehicles/:id/purchase
// @access  Private (authenticated users)
export const purchaseVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    if (vehicle.quantity <= 0) {
      return res.status(400).json({ message: 'Vehicle is out of stock' });
    }

    vehicle.quantity -= 1;
    await vehicle.save();

    return res.status(200).json(vehicle);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

