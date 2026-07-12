import Vehicle from '../models/vehicleModel.js';
import { uploadImage, deleteImage } from '../services/cloudinaryService.js';

// @desc    Create a new vehicle
// @route   POST /api/vehicles
// @access  Private (authenticated users)
export const createVehicle = async (req, res) => {
  try {
    const { make, model, category } = req.body;
    const price = Number(req.body.price);
    const quantity = Number(req.body.quantity);

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
      req.body.price === undefined ||
      req.body.price === null ||
      req.body.price === '' ||
      req.body.quantity === undefined ||
      req.body.quantity === null ||
      req.body.quantity === ''
    ) {
      return res.status(400).json({
        message: 'make, model, category, price, and quantity are required',
      });
    }

    // Validate non-negative numeric constraints before hitting the DB
    if (Number.isNaN(price) || price < 0) {
      return res.status(400).json({ message: 'Price must be a non-negative number' });
    }

    if (Number.isNaN(quantity) || quantity < 0) {
      return res.status(400).json({ message: 'Quantity must be a non-negative number' });
    }

    // Validate that an image was attached
    if (!req.file) {
      return res.status(400).json({ message: 'Vehicle image is required' });
    }

    let result;
    try {
      result = await uploadImage(req.file);
    } catch (uploadError) {
      return res.status(502).json({ message: 'Failed to upload vehicle image. Please try again.' });
    }

    const vehicle = await Vehicle.create({
      make,
      model,
      category,
      price,
      quantity,
      owner: req.user._id,
      imageUrl: result.imageUrl,
      publicId: result.publicId,
    });

    return res.status(201).json({
      _id: vehicle._id,
      make: vehicle.make,
      model: vehicle.model,
      category: vehicle.category,
      price: vehicle.price,
      quantity: vehicle.quantity,
      owner: vehicle.owner,
      imageUrl: vehicle.imageUrl,
      publicId: vehicle.publicId,
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

// @desc    Get all vehicles (paginated)
// @route   GET /api/vehicles
// @access  Private (authenticated users)
export const getVehicles = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 9);
    const skip = (page - 1) * limit;

    const [vehicles, totalVehicles] = await Promise.all([
      Vehicle.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Vehicle.countDocuments(),
    ]);

    const totalPages = Math.ceil(totalVehicles / limit);

    return res.status(200).json({
      vehicles,
      currentPage: page,
      totalPages,
      totalVehicles,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Update a vehicle
// @route   PUT /api/vehicles/:id
// @access  Private (owner only)
export const updateVehicle = async (req, res) => {
  try {
    const { make, model, category } = req.body;
    const price = req.body.price !== undefined ? Number(req.body.price) : undefined;
    const quantity = req.body.quantity !== undefined ? Number(req.body.quantity) : undefined;

    // Reject empty body
    if (Object.keys(req.body).length === 0 && !req.file) {
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
    if (price !== undefined && (Number.isNaN(price) || price < 0)) {
      return res.status(400).json({ message: 'Price must be a non-negative number' });
    }
    if (quantity !== undefined && (Number.isNaN(quantity) || quantity < 0)) {
      return res.status(400).json({ message: 'Quantity must be a non-negative number' });
    }

    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    if (vehicle.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this vehicle' });
    }

    if (req.file) {
      let result;
      try {
        result = await uploadImage(req.file);
      } catch (uploadError) {
        return res.status(502).json({ message: 'Failed to upload vehicle image. Please try again.' });
      }

      try {
        await deleteImage(vehicle.publicId);
      } catch (deleteError) {
        console.error('Failed to delete previous vehicle image from Cloudinary:', deleteError);
      }

      vehicle.imageUrl = result.imageUrl;
      vehicle.publicId = result.publicId;
    }

    if (make !== undefined) vehicle.make = make;
    if (model !== undefined) vehicle.model = model;
    if (category !== undefined) vehicle.category = category;
    if (price !== undefined) vehicle.price = price;
    if (quantity !== undefined) vehicle.quantity = quantity;

    await vehicle.save();

    return res.status(200).json(vehicle.toObject());
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
// @access  Private (owner only)
export const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    if (vehicle.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this vehicle' });
    }

    try {
      await deleteImage(vehicle.publicId);
    } catch (deleteError) {
      console.error('Failed to delete vehicle image from Cloudinary:', deleteError);
    }

    await vehicle.deleteOne();

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

// @desc    Restock a vehicle (increase quantity)
// @route   POST /api/vehicles/:id/restock
// @access  Private (owner only)
export const restockVehicle = async (req, res) => {
  try {
    const { quantity } = req.body;

    if (quantity === undefined || quantity === null) {
      return res.status(400).json({ message: 'Quantity is required' });
    }

    if (typeof quantity !== 'number') {
      return res.status(400).json({ message: 'Quantity must be a number' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than 0' });
    }

    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    if (vehicle.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to restock this vehicle' });
    }

    vehicle.quantity += quantity;
    await vehicle.save();

    return res.status(200).json(vehicle);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


