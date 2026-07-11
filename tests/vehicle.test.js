import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import User from '../models/userModel.js';
import Vehicle from '../models/vehicleModel.js';

let mongoServer;
let userToken;
let adminToken;

// ─── Helpers ────────────────────────────────────────────────────────────────

const makeToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET || 'super_secret_key_12345', {
    expiresIn: '1h',
  });

// ─── Setup / Teardown ────────────────────────────────────────────────────────

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear all collections before each test
  for (const key in mongoose.connection.collections) {
    await mongoose.connection.collections[key].deleteMany({});
  }

  // Create a regular USER and an ADMIN in the in-memory DB
  const user = await User.create({
    name: 'Regular User',
    email: 'user@example.com',
    password: 'password123',
    role: 'USER',
  });

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password123',
    role: 'ADMIN',
  });

  userToken = makeToken(user._id, user.role);
  adminToken = makeToken(admin._id, admin.role);
});

// ─── Test Suite ──────────────────────────────────────────────────────────────

describe('POST /api/vehicles', () => {
  const validVehicle = {
    make: 'Toyota',
    model: 'Camry',
    category: 'Sedan',
    price: 25000,
    quantity: 10,
  };

  // ── Authentication guard ─────────────────────────────────────────────────

  it('should reject unauthenticated requests (no token)', async () => {
    const res = await request(app).post('/api/vehicles').send(validVehicle);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/not authorized/i);
  });

  it('should reject requests with an invalid token', async () => {
    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', 'Bearer invalidtoken')
      .send(validVehicle);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  // ── Successful creation ──────────────────────────────────────────────────

  it('should create a vehicle successfully when authenticated as USER', async () => {
    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${userToken}`)
      .send(validVehicle);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.make).toBe(validVehicle.make);
    expect(res.body.model).toBe(validVehicle.model);
    expect(res.body.category).toBe(validVehicle.category);
    expect(res.body.price).toBe(validVehicle.price);
    expect(res.body.quantity).toBe(validVehicle.quantity);
    expect(res.body).toHaveProperty('createdAt');
    expect(res.body).toHaveProperty('updatedAt');
  });

  it('should create a vehicle successfully when authenticated as ADMIN', async () => {
    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validVehicle);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.make).toBe(validVehicle.make);
  });

  // ── Validation errors ────────────────────────────────────────────────────

  it('should reject when "make" is missing', async () => {
    const { make, ...withoutMake } = validVehicle;

    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${userToken}`)
      .send(withoutMake);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('should reject when "model" is missing', async () => {
    const { model, ...withoutModel } = validVehicle;

    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${userToken}`)
      .send(withoutModel);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('should reject when "category" is missing', async () => {
    const { category, ...withoutCategory } = validVehicle;

    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${userToken}`)
      .send(withoutCategory);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('should reject when "price" is missing', async () => {
    const { price, ...withoutPrice } = validVehicle;

    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${userToken}`)
      .send(withoutPrice);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('should reject when "quantity" is missing', async () => {
    const { quantity, ...withoutQuantity } = validVehicle;

    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${userToken}`)
      .send(withoutQuantity);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('should reject when "price" is a negative number', async () => {
    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ ...validVehicle, price: -500 });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('should reject when "quantity" is a negative number', async () => {
    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ ...validVehicle, quantity: -1 });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('should reject when body is empty', async () => {
    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${userToken}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });
});

// ─── GET /api/vehicles ───────────────────────────────────────────────────────

describe('GET /api/vehicles', () => {
  const sampleVehicle = {
    make: 'Toyota',
    model: 'Camry',
    category: 'Sedan',
    price: 25000,
    quantity: 10,
  };

  // ── Authentication guard ───────────────────────────────────────────────────

  it('should reject unauthenticated requests (no token)', async () => {
    const res = await request(app).get('/api/vehicles');

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/not authorized/i);
  });

  it('should reject requests with an invalid token', async () => {
    const res = await request(app)
      .get('/api/vehicles')
      .set('Authorization', 'Bearer invalidtoken');

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  // ── Empty collection ───────────────────────────────────────────────────────

  it('should return an empty array when no vehicles exist', async () => {
    const res = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(0);
  });

  // ── Successful retrieval ───────────────────────────────────────────────────

  it('should return all vehicles when authenticated as USER', async () => {
    await Vehicle.create(sampleVehicle);
    await Vehicle.create({ ...sampleVehicle, make: 'Honda', model: 'Civic' });

    const res = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
  });

  it('should return all vehicles when authenticated as ADMIN', async () => {
    await Vehicle.create(sampleVehicle);

    const res = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toHaveProperty('_id');
    expect(res.body[0].make).toBe(sampleVehicle.make);
  });

  // ── Sorted newest first ────────────────────────────────────────────────────

  it('should return vehicles sorted newest first (descending createdAt)', async () => {
    const first = await Vehicle.create({ ...sampleVehicle, make: 'Ford' });
    const second = await Vehicle.create({ ...sampleVehicle, make: 'BMW' });

    const res = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(2);
    // newest (second) should come first
    expect(res.body[0]._id).toBe(second._id.toString());
    expect(res.body[1]._id).toBe(first._id.toString());
  });

  // ── Response shape ─────────────────────────────────────────────────────────

  it('should return vehicles with expected fields', async () => {
    await Vehicle.create(sampleVehicle);

    const res = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    const vehicle = res.body[0];
    expect(vehicle).toHaveProperty('_id');
    expect(vehicle).toHaveProperty('make');
    expect(vehicle).toHaveProperty('model');
    expect(vehicle).toHaveProperty('category');
    expect(vehicle).toHaveProperty('price');
    expect(vehicle).toHaveProperty('quantity');
    expect(vehicle).toHaveProperty('createdAt');
    expect(vehicle).toHaveProperty('updatedAt');
  });
});

// ─── PUT /api/vehicles/:id ────────────────────────────────────────────────────

describe('PUT /api/vehicles/:id', () => {
  const baseVehicle = {
    make: 'Toyota',
    model: 'Camry',
    category: 'Sedan',
    price: 25000,
    quantity: 10,
  };

  // ── Authentication guard ───────────────────────────────────────────────────

  it('should reject unauthenticated requests (no token)', async () => {
    const vehicle = await Vehicle.create(baseVehicle);

    const res = await request(app)
      .put(`/api/vehicles/${vehicle._id}`)
      .send({ price: 30000 });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/not authorized/i);
  });

  it('should reject requests with an invalid token', async () => {
    const vehicle = await Vehicle.create(baseVehicle);

    const res = await request(app)
      .put(`/api/vehicles/${vehicle._id}`)
      .set('Authorization', 'Bearer invalidtoken')
      .send({ price: 30000 });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  // ── Not found ──────────────────────────────────────────────────────────────

  it('should return 404 when vehicle does not exist', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .put(`/api/vehicles/${nonExistentId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ price: 30000 });

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/not found/i);
  });

  // ── Successful update ──────────────────────────────────────────────────────

  it('should update vehicle details when authenticated as USER', async () => {
    const vehicle = await Vehicle.create(baseVehicle);

    const res = await request(app)
      .put(`/api/vehicles/${vehicle._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ price: 30000, quantity: 5 });

    expect(res.statusCode).toBe(200);
    expect(res.body.price).toBe(30000);
    expect(res.body.quantity).toBe(5);
    expect(res.body.make).toBe(baseVehicle.make);
  });

  it('should update vehicle details when authenticated as ADMIN', async () => {
    const vehicle = await Vehicle.create(baseVehicle);

    const res = await request(app)
      .put(`/api/vehicles/${vehicle._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ make: 'Honda', model: 'Accord' });

    expect(res.statusCode).toBe(200);
    expect(res.body.make).toBe('Honda');
    expect(res.body.model).toBe('Accord');
  });

  it('should return the updated vehicle with all expected fields', async () => {
    const vehicle = await Vehicle.create(baseVehicle);

    const res = await request(app)
      .put(`/api/vehicles/${vehicle._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ price: 28000 });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('_id');
    expect(res.body).toHaveProperty('make');
    expect(res.body).toHaveProperty('model');
    expect(res.body).toHaveProperty('category');
    expect(res.body).toHaveProperty('price');
    expect(res.body).toHaveProperty('quantity');
    expect(res.body).toHaveProperty('createdAt');
    expect(res.body).toHaveProperty('updatedAt');
  });

  // ── Validation errors ──────────────────────────────────────────────────────

  it('should reject when price is a negative number', async () => {
    const vehicle = await Vehicle.create(baseVehicle);

    const res = await request(app)
      .put(`/api/vehicles/${vehicle._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ price: -100 });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('should reject when quantity is a negative number', async () => {
    const vehicle = await Vehicle.create(baseVehicle);

    const res = await request(app)
      .put(`/api/vehicles/${vehicle._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ quantity: -5 });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('should reject when make is an empty string', async () => {
    const vehicle = await Vehicle.create(baseVehicle);

    const res = await request(app)
      .put(`/api/vehicles/${vehicle._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ make: '' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('should reject when request body is empty', async () => {
    const vehicle = await Vehicle.create(baseVehicle);

    const res = await request(app)
      .put(`/api/vehicles/${vehicle._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });
});

// ─── DELETE /api/vehicles/:id ─────────────────────────────────────────────────

describe('DELETE /api/vehicles/:id', () => {
  const baseVehicle = {
    make: 'Toyota',
    model: 'Camry',
    category: 'Sedan',
    price: 25000,
    quantity: 10,
  };

  // ── Authentication guard ───────────────────────────────────────────────────

  it('should reject unauthenticated requests (no token)', async () => {
    const vehicle = await Vehicle.create(baseVehicle);

    const res = await request(app).delete(`/api/vehicles/${vehicle._id}`);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/not authorized/i);
  });

  it('should reject requests with an invalid token', async () => {
    const vehicle = await Vehicle.create(baseVehicle);

    const res = await request(app)
      .delete(`/api/vehicles/${vehicle._id}`)
      .set('Authorization', 'Bearer invalidtoken');

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  // ── Authorization guard (ADMIN only) ──────────────────────────────────────

  it('should return 403 when authenticated as USER (non-admin)', async () => {
    const vehicle = await Vehicle.create(baseVehicle);

    const res = await request(app)
      .delete(`/api/vehicles/${vehicle._id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/not authorized/i);
  });

  // ── Not found ──────────────────────────────────────────────────────────────

  it('should return 404 when vehicle does not exist (as ADMIN)', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .delete(`/api/vehicles/${nonExistentId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/not found/i);
  });

  // ── Successful deletion ────────────────────────────────────────────────────

  it('should delete vehicle when authenticated as ADMIN', async () => {
    const vehicle = await Vehicle.create(baseVehicle);

    const res = await request(app)
      .delete(`/api/vehicles/${vehicle._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/deleted/i);
  });

  it('should remove the vehicle from the database after deletion', async () => {
    const vehicle = await Vehicle.create(baseVehicle);

    await request(app)
      .delete(`/api/vehicles/${vehicle._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const deleted = await Vehicle.findById(vehicle._id);
    expect(deleted).toBeNull();
  });
});

// ─── GET /api/vehicles/search ─────────────────────────────────────────────────

describe('GET /api/vehicles/search', () => {
  // ── Seed data ──────────────────────────────────────────────────────────────

  beforeEach(async () => {
    await Vehicle.create([
      { make: 'Toyota', model: 'Camry',   category: 'Sedan',   price: 25000, quantity: 5 },
      { make: 'Toyota', model: 'RAV4',    category: 'SUV',     price: 35000, quantity: 3 },
      { make: 'Honda',  model: 'Civic',   category: 'Sedan',   price: 20000, quantity: 8 },
      { make: 'Honda',  model: 'CR-V',    category: 'SUV',     price: 32000, quantity: 2 },
      { make: 'Ford',   model: 'Mustang', category: 'Coupe',   price: 45000, quantity: 1 },
    ]);
  });

  // ── Authentication guard ───────────────────────────────────────────────────

  it('should reject unauthenticated requests (no token)', async () => {
    const res = await request(app).get('/api/vehicles/search');

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/not authorized/i);
  });

  it('should reject requests with an invalid token', async () => {
    const res = await request(app)
      .get('/api/vehicles/search')
      .set('Authorization', 'Bearer invalidtoken');

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  // ── Filter by make ─────────────────────────────────────────────────────────

  it('should filter vehicles by make', async () => {
    const res = await request(app)
      .get('/api/vehicles/search?make=Toyota')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
    res.body.forEach((v) => expect(v.make).toBe('Toyota'));
  });

  // ── Filter by model ────────────────────────────────────────────────────────

  it('should filter vehicles by model', async () => {
    const res = await request(app)
      .get('/api/vehicles/search?model=Civic')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].model).toBe('Civic');
  });

  // ── Filter by category ─────────────────────────────────────────────────────

  it('should filter vehicles by category', async () => {
    const res = await request(app)
      .get('/api/vehicles/search?category=SUV')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(2);
    res.body.forEach((v) => expect(v.category).toBe('SUV'));
  });

  // ── Filter by minPrice ─────────────────────────────────────────────────────

  it('should filter vehicles by minimum price', async () => {
    const res = await request(app)
      .get('/api/vehicles/search?minPrice=35000')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(2); // RAV4 (35000) and Mustang (45000)
    res.body.forEach((v) => expect(v.price).toBeGreaterThanOrEqual(35000));
  });

  // ── Filter by maxPrice ─────────────────────────────────────────────────────

  it('should filter vehicles by maximum price', async () => {
    const res = await request(app)
      .get('/api/vehicles/search?maxPrice=25000')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(2); // Camry (25000) and Civic (20000)
    res.body.forEach((v) => expect(v.price).toBeLessThanOrEqual(25000));
  });

  // ── Combine multiple filters ───────────────────────────────────────────────

  it('should combine make and category filters', async () => {
    const res = await request(app)
      .get('/api/vehicles/search?make=Honda&category=SUV')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].make).toBe('Honda');
    expect(res.body[0].model).toBe('CR-V');
  });

  it('should combine minPrice and maxPrice filters', async () => {
    const res = await request(app)
      .get('/api/vehicles/search?minPrice=25000&maxPrice=35000')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(3); // Camry (25000), CR-V (32000), RAV4 (35000)
    res.body.forEach((v) => {
      expect(v.price).toBeGreaterThanOrEqual(25000);
      expect(v.price).toBeLessThanOrEqual(35000);
    });
  });

  it('should combine make and price range filters', async () => {
    const res = await request(app)
      .get('/api/vehicles/search?make=Toyota&minPrice=30000')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].model).toBe('RAV4');
  });

  // ── No matching results ────────────────────────────────────────────────────

  it('should return an empty array when no vehicles match the filters', async () => {
    const res = await request(app)
      .get('/api/vehicles/search?make=BMW')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(0);
  });

  // ── No filters returns all vehicles ───────────────────────────────────────

  it('should return all vehicles when no filters are provided', async () => {
    const res = await request(app)
      .get('/api/vehicles/search')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(5);
  });

  // ── Response shape ─────────────────────────────────────────────────────────

  it('should return vehicles with expected fields', async () => {
    const res = await request(app)
      .get('/api/vehicles/search?make=Ford')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
    const vehicle = res.body[0];
    expect(vehicle).toHaveProperty('_id');
    expect(vehicle).toHaveProperty('make');
    expect(vehicle).toHaveProperty('model');
    expect(vehicle).toHaveProperty('category');
    expect(vehicle).toHaveProperty('price');
    expect(vehicle).toHaveProperty('quantity');
    expect(vehicle).toHaveProperty('createdAt');
    expect(vehicle).toHaveProperty('updatedAt');
  });
});

// ─── POST /api/vehicles/:id/purchase ───────────────────────────────────────────

describe('POST /api/vehicles/:id/purchase', () => {
  const baseVehicle = {
    make: 'Honda',
    model: 'Civic',
    category: 'Sedan',
    price: 22000,
    quantity: 2,
  };

  it('should reject unauthenticated requests (no token)', async () => {
    const vehicle = await Vehicle.create(baseVehicle);
    const res = await request(app).post(`/api/vehicles/${vehicle._id}/purchase`);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/not authorized/i);
  });

  it('should return 404 when vehicle does not exist', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post(`/api/vehicles/${nonExistentId}/purchase`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/not found/i);
  });

  it('should decrease vehicle quantity by 1 and return updated vehicle details on success', async () => {
    const vehicle = await Vehicle.create(baseVehicle);
    const res = await request(app)
      .post(`/api/vehicles/${vehicle._id}/purchase`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.quantity).toBe(1);
    expect(res.body.make).toBe(baseVehicle.make);
  });

  it('should fail when vehicle is out of stock (quantity is 0)', async () => {
    const vehicle = await Vehicle.create({ ...baseVehicle, quantity: 0 });
    const res = await request(app)
      .post(`/api/vehicles/${vehicle._id}/purchase`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/out of stock/i);
  });
});

