import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('Public tracking', () => {
  it('returns shipment details for a known tracking number', async () => {
    const res = await request(app).get('/api/shipments/TRK-DEMO-001');

    expect(res.status).toBe(200);
    expect(res.body.trackingNumber).toBe('TRK-DEMO-001');
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('events');
    expect(Array.isArray(res.body.events)).toBe(true);
  });

  it('returns 404 for an unknown tracking number', async () => {
    const res = await request(app).get('/api/shipments/TRK-DOES-NOT-EXIST');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('Staff authentication', () => {
  it('rejects a staff request with no session', async () => {
    const res = await request(app).get('/api/staff/shipments');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('rejects login with an incorrect password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: process.env.SEED_STAFF_EMAIL,
        password: 'definitely-wrong',
      });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});

describe('Enquiry validation', () => {
  it('rejects an enquiry with a missing message', async () => {
    const res = await request(app)
      .post('/api/enquiries')
      .send({ trackingNumber: 'TRK-DEMO-001', category: 'General Question' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
