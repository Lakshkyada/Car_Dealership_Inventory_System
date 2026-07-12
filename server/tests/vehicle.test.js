import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import User from '../models/userModel.js';
import Vehicle from '../models/vehicleModel.js';



// ─── Fixtures ────────────────────────────────────────────────────────────────

const SAMPLE_IMAGE_URL = 'https://res.cloudinary.com/demo/image/upload/v1/car-dealership-vehicles/sample.jpg';
const SAMPLE_PUBLIC_ID = 'car-dealership-vehicles/sample';
const MOCK_IMAGE_URL = 'https://res.cloudinary.com/demo/image/upload/v1/car-dealership-vehicles/mock.jpg';
const MOCK_PUBLIC_ID = 'car-dealership-vehicles/mock';

let mongoServer;
let userToken;
let adminToken;
let user;
let admin;

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

  // Create two regular authenticated accounts (used as "owner" and "another user"
  // in ownership-based authorization tests below).
  user = await User.create({
    name: 'Regular User',
    email: 'user@example.com',
    password: 'password123',
    role: 'USER',
  });

  admin = await User.create({
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
    imageUrl: SAMPLE_IMAGE_URL,
    publicId: SAMPLE_PUBLIC_ID,
  };

  // Helper: build multipart request with all vehicle fields + optional image.
  const postVehicle = (
    token,
    fields = { make: 'Toyota', model: 'Camry', category: 'Sedan', price: 25000, quantity: 10 },
    { attachImage = true, filename = 'vehicle.jpg', fileContent = Buffer.from('fake-image') } = {}
  ) => {
    let req = request(app).post('/api/vehicles');
    if (token) req = req.set('Authorization', `Bearer ${token}`);
    Object.entries(fields).forEach(([k, v]) => { req = req.field(k, String(v)); });
    if (attachImage) req = req.attach('image', fileContent, filename);
    return req;
  };

  // ── Authentication guard ───────────────────────────────────────────────────

  it('should reject unauthenticated requests (no token)', async () => {
    const res = await postVehicle(null);
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/not authorized/i);
  });

  it('should reject requests with an invalid token', async () => {
    const res = await postVehicle('invalidtoken');
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  // ── Successful creation ───────────────────────────────────────────────────

  it('should create a vehicle successfully when authenticated as USER', async () => {
    const res = await postVehicle(userToken);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.make).toBe('Toyota');
    expect(res.body.model).toBe('Camry');
    expect(res.body.owner).toBe(user._id.toString());
    expect(res.body.imageUrl).toBe(MOCK_IMAGE_URL);
    expect(res.body.publicId).toBe(MOCK_PUBLIC_ID);
    expect(res.body).toHaveProperty('createdAt');
    expect(res.body).toHaveProperty('updatedAt');
  });

  it('should create a vehicle successfully when authenticated as ADMIN', async () => {
    const res = await postVehicle(adminToken);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.make).toBe('Toyota');
    expect(res.body.owner).toBe(admin._id.toString());
    expect(res.body.imageUrl).toBe(MOCK_IMAGE_URL);
  });

  // ── Validation errors ───────────────────────────────────────────────────

  it('should reject when "make" is missing', async () => {
    const res = await postVehicle(userToken, { model: 'Camry', category: 'Sedan', price: 25000, quantity: 10 });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('should reject when "model" is missing', async () => {
    const res = await postVehicle(userToken, { make: 'Toyota', category: 'Sedan', price: 25000, quantity: 10 });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('should reject when "category" is missing', async () => {
    const res = await postVehicle(userToken, { make: 'Toyota', model: 'Camry', price: 25000, quantity: 10 });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('should reject when "price" is missing', async () => {
    const res = await postVehicle(userToken, { make: 'Toyota', model: 'Camry', category: 'Sedan', quantity: 10 });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('should reject when "quantity" is missing', async () => {
    const res = await postVehicle(userToken, { make: 'Toyota', model: 'Camry', category: 'Sedan', price: 25000 });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('should reject when "price" is a negative number', async () => {
    const res = await postVehicle(userToken, { make: 'Toyota', model: 'Camry', category: 'Sedan', price: -500, quantity: 10 });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('should reject when "quantity" is a negative number', async () => {
    const res = await postVehicle(userToken, { make: 'Toyota', model: 'Camry', category: 'Sedan', price: 25000, quantity: -1 });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('should reject when required fields are missing and no image is attached', async () => {
    // postVehicle with a dummy field ensures multipart content-type → multer parses → controller validates → 400
    const res = await postVehicle(
      userToken,
      { make: '' }, // single field triggers multipart content-type
      { attachImage: false }
    );
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  // ── Image requirement ───────────────────────────────────────────────────

  it('should reject when no image is attached', async () => {
    const res = await postVehicle(userToken, undefined, { attachImage: false });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/image is required/i);
  });

  it('should reject when the attached file is not an image', async () => {
    const res = await postVehicle(userToken, undefined, {
      filename: 'notes.txt',
      fileContent: Buffer.from('just some text'),
    });
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
    imageUrl: SAMPLE_IMAGE_URL,
    publicId: SAMPLE_PUBLIC_ID,
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

  it('should return an empty vehicles array when no vehicles exist', async () => {
    const res = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('vehicles');
    expect(Array.isArray(res.body.vehicles)).toBe(true);
    expect(res.body.vehicles).toHaveLength(0);
    expect(res.body.totalVehicles).toBe(0);
  });

  // ── Successful retrieval ───────────────────────────────────────────────────

  it('should return all vehicles when authenticated as USER', async () => {
    await Vehicle.create({ ...sampleVehicle, owner: user._id });
    await Vehicle.create({ ...sampleVehicle, make: 'Honda', model: 'Civic', owner: user._id });

    const res = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('vehicles');
    expect(Array.isArray(res.body.vehicles)).toBe(true);
    expect(res.body.vehicles).toHaveLength(2);
  });

  it('should return all vehicles when authenticated as ADMIN', async () => {
    await Vehicle.create({ ...sampleVehicle, owner: user._id });

    const res = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('vehicles');
    expect(Array.isArray(res.body.vehicles)).toBe(true);
    expect(res.body.vehicles).toHaveLength(1);
    expect(res.body.vehicles[0]).toHaveProperty('_id');
    expect(res.body.vehicles[0].make).toBe(sampleVehicle.make);
  });

  // ── Sorted newest first ───────────────────────────────────────────────────

  it('should return vehicles sorted newest first (descending createdAt)', async () => {
    const first = await Vehicle.create({ ...sampleVehicle, make: 'Ford', owner: user._id });
    const second = await Vehicle.create({ ...sampleVehicle, make: 'BMW', owner: user._id });

    const res = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.vehicles).toHaveLength(2);
    // newest (second) should come first
    expect(res.body.vehicles[0]._id).toBe(second._id.toString());
    expect(res.body.vehicles[1]._id).toBe(first._id.toString());
  });

  // ── Response shape ─────────────────────────────────────────────────────────

  it('should return vehicles with expected fields', async () => {
    await Vehicle.create({ ...sampleVehicle, owner: user._id });

    const res = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    const vehicle = res.body.vehicles[0];
    expect(vehicle).toHaveProperty('_id');
    expect(vehicle).toHaveProperty('make');
    expect(vehicle).toHaveProperty('model');
    expect(vehicle).toHaveProperty('category');
    expect(vehicle).toHaveProperty('price');
    expect(vehicle).toHaveProperty('quantity');
    expect(vehicle).toHaveProperty('owner');
    expect(vehicle).toHaveProperty('imageUrl');
    expect(vehicle).toHaveProperty('publicId');
    expect(vehicle).toHaveProperty('createdAt');
    expect(vehicle).toHaveProperty('updatedAt');
  });
});

// ─── GET /api/vehicles – Pagination ──────────────────────────────────────────

describe('GET /api/vehicles (pagination)', () => {
  const baseVehicle = {
    make: 'Toyota',
    model: 'Camry',
    category: 'Sedan',
    price: 25000,
    quantity: 5,
    imageUrl: SAMPLE_IMAGE_URL,
    publicId: SAMPLE_PUBLIC_ID,
  };

  const seedVehicles = async (count) => {
    const docs = Array.from({ length: count }, (_, i) => ({
      ...baseVehicle,
      make: `Make${i}`,
      owner: user._id,
    }));
    return Vehicle.insertMany(docs);
  };

  it('should return the correct pagination envelope fields', async () => {
    await seedVehicles(3);
    const res = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('vehicles');
    expect(res.body).toHaveProperty('currentPage');
    expect(res.body).toHaveProperty('totalPages');
    expect(res.body).toHaveProperty('totalVehicles');
    expect(res.body).toHaveProperty('hasNextPage');
    expect(res.body).toHaveProperty('hasPreviousPage');
  });

  it('should default to page 1 with limit 9', async () => {
    await seedVehicles(5);
    const res = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.currentPage).toBe(1);
    expect(res.body.vehicles).toHaveLength(5);
    expect(res.body.totalVehicles).toBe(5);
    expect(res.body.hasNextPage).toBe(false);
    expect(res.body.hasPreviousPage).toBe(false);
  });

  it('should return at most 9 vehicles by default when more than 9 exist', async () => {
    await seedVehicles(12);
    const res = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.vehicles).toHaveLength(9);
    expect(res.body.totalVehicles).toBe(12);
    expect(res.body.totalPages).toBe(2);
    expect(res.body.hasNextPage).toBe(true);
    expect(res.body.hasPreviousPage).toBe(false);
  });

  it('should return vehicles for a specific page', async () => {
    await seedVehicles(10);
    const res = await request(app)
      .get('/api/vehicles?page=2&limit=9')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.currentPage).toBe(2);
    expect(res.body.vehicles).toHaveLength(1);
    expect(res.body.hasNextPage).toBe(false);
    expect(res.body.hasPreviousPage).toBe(true);
  });

  it('should respect a custom limit query param', async () => {
    await seedVehicles(6);
    const res = await request(app)
      .get('/api/vehicles?limit=4')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.vehicles).toHaveLength(4);
    expect(res.body.totalPages).toBe(2);
    expect(res.body.hasNextPage).toBe(true);
  });

  it('should set hasPreviousPage true when on page 2 or beyond', async () => {
    await seedVehicles(10);
    const res = await request(app)
      .get('/api/vehicles?page=2&limit=5')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.hasPreviousPage).toBe(true);
    expect(res.body.hasNextPage).toBe(false);
  });

  it('should compute totalPages correctly (ceil)', async () => {
    await seedVehicles(20);
    const res = await request(app)
      .get('/api/vehicles?limit=9')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.totalPages).toBe(3); // ceil(20/9) = 3
  });

  it('should clamp page to 1 when an invalid page value is provided', async () => {
    await seedVehicles(3);
    const res = await request(app)
      .get('/api/vehicles?page=0')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.currentPage).toBe(1);
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
    imageUrl: SAMPLE_IMAGE_URL,
    publicId: SAMPLE_PUBLIC_ID,
  };

  // ── Authentication guard ────────────────────────────────────────────────────────

  it('should reject unauthenticated requests (no token)', async () => {
    const vehicle = await Vehicle.create({ ...baseVehicle, owner: user._id });

    const res = await request(app)
      .put(`/api/vehicles/${vehicle._id}`)
      .send({ price: 30000 });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/not authorized/i);
  });

  it('should reject requests with an invalid token', async () => {
    const vehicle = await Vehicle.create({ ...baseVehicle, owner: user._id });

    const res = await request(app)
      .put(`/api/vehicles/${vehicle._id}`)
      .set('Authorization', 'Bearer invalidtoken')
      .send({ price: 30000 });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  // ── Not found ──────────────────────────────────────────────────────

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

  // ── Ownership guard ───────────────────────────────────────────────────

  it('should return 403 when a non-owner tries to update the vehicle', async () => {
    const vehicle = await Vehicle.create({ ...baseVehicle, owner: user._id });

    const res = await request(app)
      .put(`/api/vehicles/${vehicle._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: 30000 });

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/not authorized/i);
  });

  // ── Successful update ──────────────────────────────────────────────────

  it('should update vehicle details when the owner makes the request', async () => {
    const vehicle = await Vehicle.create({ ...baseVehicle, owner: user._id });

    const res = await request(app)
      .put(`/api/vehicles/${vehicle._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ price: 30000, quantity: 5 });

    expect(res.statusCode).toBe(200);
    expect(res.body.price).toBe(30000);
    expect(res.body.quantity).toBe(5);
    expect(res.body.make).toBe(baseVehicle.make);
  });

  it('should return the updated vehicle with all expected fields', async () => {
    const vehicle = await Vehicle.create({ ...baseVehicle, owner: user._id });

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
    expect(res.body).toHaveProperty('owner');
    expect(res.body).toHaveProperty('createdAt');
    expect(res.body).toHaveProperty('updatedAt');
  });

  // ── Validation errors ─────────────────────────────────────────────────

  it('should reject when price is a negative number', async () => {
    const vehicle = await Vehicle.create({ ...baseVehicle, owner: user._id });

    const res = await request(app)
      .put(`/api/vehicles/${vehicle._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ price: -100 });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('should reject when quantity is a negative number', async () => {
    const vehicle = await Vehicle.create({ ...baseVehicle, owner: user._id });

    const res = await request(app)
      .put(`/api/vehicles/${vehicle._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ quantity: -5 });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('should reject when make is an empty string', async () => {
    const vehicle = await Vehicle.create({ ...baseVehicle, owner: user._id });

    const res = await request(app)
      .put(`/api/vehicles/${vehicle._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ make: '' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('should reject when request body is empty', async () => {
    const vehicle = await Vehicle.create({ ...baseVehicle, owner: user._id });

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
    imageUrl: SAMPLE_IMAGE_URL,
    publicId: SAMPLE_PUBLIC_ID,
  };

  // ── Authentication guard ───────────────────────────────────────────────────

  it('should reject unauthenticated requests (no token)', async () => {
    const vehicle = await Vehicle.create({ ...baseVehicle, owner: user._id });

    const res = await request(app).delete(`/api/vehicles/${vehicle._id}`);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/not authorized/i);
  });

  it('should reject requests with an invalid token', async () => {
    const vehicle = await Vehicle.create({ ...baseVehicle, owner: user._id });

    const res = await request(app)
      .delete(`/api/vehicles/${vehicle._id}`)
      .set('Authorization', 'Bearer invalidtoken');

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  // ── Authorization guard (owner only) ──────────────────────────

  it('should return 403 when a non-owner tries to delete the vehicle', async () => {
    const vehicle = await Vehicle.create({ ...baseVehicle, owner: user._id });

    const res = await request(app)
      .delete(`/api/vehicles/${vehicle._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/not authorized/i);
  });

  // ── Not found ──────────────────────────────────────────────────────

  it('should return 404 when vehicle does not exist', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .delete(`/api/vehicles/${nonExistentId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/not found/i);
  });

  // ── Successful deletion ─────────────────────────────────────────────────

  it('should delete vehicle when the owner makes the request', async () => {
    const vehicle = await Vehicle.create({ ...baseVehicle, owner: user._id });

    const res = await request(app)
      .delete(`/api/vehicles/${vehicle._id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/deleted/i);
  });

  it('should remove the vehicle from the database after deletion', async () => {
    const vehicle = await Vehicle.create({ ...baseVehicle, owner: user._id });

    await request(app)
      .delete(`/api/vehicles/${vehicle._id}`)
      .set('Authorization', `Bearer ${userToken}`);

    const deleted = await Vehicle.findById(vehicle._id);
    expect(deleted).toBeNull();
  });
});

// ─── GET /api/vehicles/search ─────────────────────────────────────────────────

describe('GET /api/vehicles/search', () => {
  // ── Seed data ──────────────────────────────────────────────────────────────

  beforeEach(async () => {
    await Vehicle.create([
      { make: 'Toyota', model: 'Camry',   category: 'Sedan',   price: 25000, quantity: 5, owner: user._id, imageUrl: SAMPLE_IMAGE_URL, publicId: SAMPLE_PUBLIC_ID },
      { make: 'Toyota', model: 'RAV4',    category: 'SUV',     price: 35000, quantity: 3, owner: user._id, imageUrl: SAMPLE_IMAGE_URL, publicId: SAMPLE_PUBLIC_ID },
      { make: 'Honda',  model: 'Civic',   category: 'Sedan',   price: 20000, quantity: 8, owner: user._id, imageUrl: SAMPLE_IMAGE_URL, publicId: SAMPLE_PUBLIC_ID },
      { make: 'Honda',  model: 'CR-V',    category: 'SUV',     price: 32000, quantity: 2, owner: user._id, imageUrl: SAMPLE_IMAGE_URL, publicId: SAMPLE_PUBLIC_ID },
      { make: 'Ford',   model: 'Mustang', category: 'Coupe',   price: 45000, quantity: 1, owner: user._id, imageUrl: SAMPLE_IMAGE_URL, publicId: SAMPLE_PUBLIC_ID },
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
    imageUrl: SAMPLE_IMAGE_URL,
    publicId: SAMPLE_PUBLIC_ID,
  };

  it('should reject unauthenticated requests (no token)', async () => {
    const vehicle = await Vehicle.create({ ...baseVehicle, owner: user._id });
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
    const vehicle = await Vehicle.create({ ...baseVehicle, owner: user._id });
    const res = await request(app)
      .post(`/api/vehicles/${vehicle._id}/purchase`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.quantity).toBe(1);
    expect(res.body.make).toBe(baseVehicle.make);
  });

  it('should fail when vehicle is out of stock (quantity is 0)', async () => {
    const vehicle = await Vehicle.create({ ...baseVehicle, quantity: 0, owner: user._id });
    const res = await request(app)
      .post(`/api/vehicles/${vehicle._id}/purchase`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/out of stock/i);
  });
});

// ─── POST /api/vehicles/:id/restock ────────────────────────────────────────────

describe('POST /api/vehicles/:id/restock', () => {
  const baseVehicle = {
    make: 'Honda',
    model: 'Civic',
    category: 'Sedan',
    price: 22000,
    quantity: 2,
    imageUrl: SAMPLE_IMAGE_URL,
    publicId: SAMPLE_PUBLIC_ID,
  };

  it('should reject unauthenticated requests (no token)', async () => {
    const vehicle = await Vehicle.create({ ...baseVehicle, owner: user._id });
    const res = await request(app)
      .post(`/api/vehicles/${vehicle._id}/restock`)
      .send({ quantity: 5 });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/not authorized/i);
  });

  it('should reject requests from a non-owner', async () => {
    const vehicle = await Vehicle.create({ ...baseVehicle, owner: user._id });
    const res = await request(app)
      .post(`/api/vehicles/${vehicle._id}/restock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ quantity: 5 });

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/not authorized/i);
  });

  it('should return 404 when vehicle does not exist', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post(`/api/vehicles/${nonExistentId}/restock`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ quantity: 5 });

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/not found/i);
  });

  it('should reject when quantity is missing', async () => {
    const vehicle = await Vehicle.create({ ...baseVehicle, owner: user._id });
    const res = await request(app)
      .post(`/api/vehicles/${vehicle._id}/restock`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/quantity is required/i);
  });

  it('should reject when quantity is not a number', async () => {
    const vehicle = await Vehicle.create({ ...baseVehicle, owner: user._id });
    const res = await request(app)
      .post(`/api/vehicles/${vehicle._id}/restock`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ quantity: 'five' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/must be a number/i);
  });

  it('should reject when quantity is less than or equal to 0', async () => {
    const vehicle = await Vehicle.create({ ...baseVehicle, owner: user._id });
    const res = await request(app)
      .post(`/api/vehicles/${vehicle._id}/restock`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ quantity: 0 });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/greater than 0/i);
  });

  it('should increase vehicle quantity and return updated details on success', async () => {
    const vehicle = await Vehicle.create({ ...baseVehicle, owner: user._id });
    const res = await request(app)
      .post(`/api/vehicles/${vehicle._id}/restock`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ quantity: 5 });

    expect(res.statusCode).toBe(200);
    expect(res.body.quantity).toBe(7);
    expect(res.body.make).toBe(baseVehicle.make);
  });
});


