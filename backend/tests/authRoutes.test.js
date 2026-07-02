process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';

jest.mock('../services/authService', () => ({
  register: jest.fn(async () => ({
    user: { id: 'user_1', email: 'demo@example.com', fullName: 'Demo User' },
    organization: { id: 'org_1', name: 'Demo Org' },
    accessToken: 'register-token'
  })),
  login: jest.fn(async () => ({
    user: { id: 'user_1', email: 'demo@example.com', fullName: 'Demo User' },
    accessToken: 'login-token'
  })),
  getCurrentUser: jest.fn(async () => ({
    id: 'user_1',
    email: 'demo@example.com',
    fullName: 'Demo User'
  }))
}));

jest.mock('../models/prisma', () => ({
  user: {
    findUnique: jest.fn(async () => ({
      id: 'user_1',
      email: 'demo@example.com',
      fullName: 'Demo User',
      role: 'MEMBER'
    }))
  },
  organizationMember: {
    findUnique: jest.fn()
  }
}));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const createApp = require('../app');

const app = createApp();

describe('Auth routes', () => {
  test('registers a user', async () => {
    const response = await request(app).post('/api/auth/register').send({
      email: 'demo@example.com',
      password: 'Password123!',
      fullName: 'Demo User',
      organizationName: 'Demo Org'
    });

    expect(response.status).toBe(201);
    expect(response.body.data.accessToken).toBe('register-token');
  });

  test('returns the current user', async () => {
    const token = jwt.sign({ sub: 'user_1', email: 'demo@example.com', role: 'MEMBER' }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    const response = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe('demo@example.com');
  });
});
