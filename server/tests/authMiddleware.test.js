import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import jwt from 'jsonwebtoken';
import { protect } from '../middleware/authMiddleware.js';
import User from '../models/userModel.js';

let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Setup express test app
  app = express();
  app.use(express.json());
  app.get('/test-protect', protect, (req, res) => {
    res.status(200).json({
      success: true,
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
    });
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('Authentication Middleware - protect', () => {
  const testUser = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'password123',
    role: 'USER',
  };

  it('should return 401 and "Not authorized, no token" when Authorization header is missing', async () => {
    const res = await request(app).get('/test-protect');
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: 'Not authorized, no token' });
  });

  it('should return 401 and "Not authorized, no token" when Bearer scheme is missing in Authorization header', async () => {
    const res = await request(app)
      .get('/test-protect')
      .set('Authorization', 'InvalidFormatTokenHere');
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: 'Not authorized, no token' });
  });

  it('should return 401 and "Not authorized, invalid token" when token is invalid', async () => {
    const res = await request(app)
      .get('/test-protect')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: 'Not authorized, invalid token' });
  });

  it('should return 401 and "Not authorized, token expired" when token is expired', async () => {
    // Generate token that expired immediately
    const expiredToken = jwt.sign(
      { id: new mongoose.Types.ObjectId(), role: 'USER' },
      process.env.JWT_SECRET || 'super_secret_key_12345',
      { expiresIn: '-1s' }
    );

    const res = await request(app)
      .get('/test-protect')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: 'Not authorized, token expired' });
  });

  it('should return 401 and "Not authorized, user not found" when user in token payload does not exist in DB', async () => {
    const nonExistentUserId = new mongoose.Types.ObjectId();
    const token = jwt.sign(
      { id: nonExistentUserId, role: 'USER' },
      process.env.JWT_SECRET || 'super_secret_key_12345',
      { expiresIn: '1h' }
    );

    const res = await request(app)
      .get('/test-protect')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: 'Not authorized, user not found' });
  });

  it('should attach user to request and return 200 when token is valid', async () => {
    const user = await User.create(testUser);
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'super_secret_key_12345',
      { expiresIn: '1h' }
    );

    const res = await request(app)
      .get('/test-protect')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user._id).toBe(user._id.toString());
    expect(res.body.user.name).toBe(user.name);
    expect(res.body.user.email).toBe(user.email);
    expect(res.body.user.role).toBe(user.role);
  });
});
