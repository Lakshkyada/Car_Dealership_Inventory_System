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
