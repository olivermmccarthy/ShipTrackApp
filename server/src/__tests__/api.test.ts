import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { prisma } from '../db.js';

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

  it('never exposes internal notes through the public endpoint', async () => {
    const noteBody = `Internal-only test note ${Date.now()}`;

    try {
      // Log in as staff and add an internal note directly via the API
      const login = await request(app).post('/api/auth/login').send({
        email: process.env.SEED_STAFF_EMAIL,
        password: process.env.SEED_STAFF_PASSWORD,
      });

      const cookie = login.headers['set-cookie'];

      const staffView = await request(app)
        .get('/api/staff/shipments?q=TRK-DEMO-001')
        .set('Cookie', cookie);
      const shipmentId = staffView.body.shipments[0].id;

      await request(app)
        .post(`/api/staff/shipments/${shipmentId}/notes`)
        .set('Cookie', cookie)
        .send({ body: noteBody });

      // Now check the public endpoint never mentions it
      const publicRes = await request(app).get('/api/shipments/TRK-DEMO-001');

      expect(publicRes.status).toBe(200);
      expect(JSON.stringify(publicRes.body)).not.toContain(noteBody);
      expect(publicRes.body).not.toHaveProperty('notes');
    } finally {
      // Remove the test note so repeated runs (including CI) leave no trace
      await prisma.internalNote.deleteMany({ where: { body: noteBody } });
    }
  });
});

describe('Staff authentication', () => {
  it('rejects a staff request with no session', async () => {
    const res = await request(app).get('/api/staff/shipments');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('rejects login with an incorrect password', async () => {
    const res = await request(app).post('/api/auth/login').send({
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
