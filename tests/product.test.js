const mongoose = require('mongoose');
const request = require('supertest');
const dotenv = require('dotenv');
const path = require('path');
const dbConnection = require('@config/database');

const app = require('../app'); // <-- adjust relative path from tests folder

dotenv.config({ path: path.join(__dirname, '../config.env') });

// Connect before all tests
beforeAll(async () => {
  try {
    await dbConnection();
    console.log('✅ Database connected');
  } catch (err) {
    console.error('❌ Database connection failed: %s', err.message);
    throw err; // Let Jest fail naturally
  }
});

// Close after all tests
afterAll(async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.warn('MongoDB connection closed');
    }
  } catch (e) {
    console.error('Error closing MongoDB connection: %s', e.message);
  }
});

describe('GET /api/v1/products', () => {
  it('should return all products', async () => {
    const res = await request(app).get('/api/v1/products');
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  }, 10000); // 10s timeout
});
