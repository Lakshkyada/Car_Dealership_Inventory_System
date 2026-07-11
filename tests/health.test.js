import request from 'supertest';
import app from '../app.js';

describe('GET /health', () => {
  it('should return 200 OK and a healthy status message', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      status: 'OK',
      message: 'Server is healthy and running',
    }));
  });
});
