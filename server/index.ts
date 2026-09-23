import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import { prisma } from './src/db.js';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Router } from 'express';
import {
  requireAuth,
  type AuthedRequest,
} from './src/middleware/requireAuth.js';

const app = express();
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const JWT_SECRET = process.env.JWT_SECRET;

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/shipments/:trackingNumber', async (req, res) => {
  const shipment = await prisma.shipment.findUnique({
    where: { trackingNumber: req.params.trackingNumber.toUpperCase() },
    include: {
      events: { orderBy: { occurredAt: 'asc' } },
    },
  });

  if (!shipment) {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'No shipment found with that tracking number.',
      },
    });
  }

  res.json({
    trackingNumber: shipment.trackingNumber,
    status: shipment.status,
    origin: shipment.origin,
    destination: shipment.destination,
    estimatedDelivery: shipment.estimatedDelivery,
    originalEstimatedDelivery: shipment.originalEstimatedDelivery,
    currentLocation: shipment.currentLocation,
    details: shipment.details,
    events: shipment.events.map((e) => ({
      status: e.status,
      location: e.location,
      message: e.message,
      occurredAt: e.occurredAt,
    })),
  });
});

const port = process.env.PORT ?? 3001;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

app.post('/api/enquiries', async (req, res) => {
  const { trackingNumber, category, message } = req.body;

  if (
    typeof trackingNumber !== 'string' ||
    typeof category !== 'string' ||
    typeof message !== 'string' ||
    !trackingNumber.trim() ||
    !category.trim() ||
    !message.trim()
  ) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'trackingNumber, category and message are all required.',
      },
    });
  }

  const shipment = await prisma.shipment.findUnique({
    where: { trackingNumber: trackingNumber.toUpperCase() },
  });

  if (!shipment) {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'No shipment found with that tracking number.',
      },
    });
  }

  const enquiry = await prisma.enquiry.create({
    data: {
      trackingNumber: shipment.trackingNumber,
      category,
      message,
    },
  });

  res.status(201).json({
    id: enquiry.id,
    trackingNumber: enquiry.trackingNumber,
    category: enquiry.category,
    message: enquiry.message,
    state: enquiry.state,
    createdAt: enquiry.createdAt,
  });
});
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'email and password are required.',
      },
    });
  }

  const staff = await prisma.staffUser.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (!staff || !(await bcrypt.compare(password, staff.passwordHash))) {
    return res.status(401).json({
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      },
    });
  }

  const token = jwt.sign({ staffId: staff.id }, JWT_SECRET, {
    expiresIn: '4h',
  });
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 4 * 60 * 60 * 1000,
  });

  res.json({ id: staff.id, email: staff.email });
});

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

const staffRouter = Router();
staffRouter.use(requireAuth);

staffRouter.get('/me', async (req: AuthedRequest, res) => {
  const staff = await prisma.staffUser.findUnique({
    where: { id: req.staffId },
  });
  if (!staff) {
    return res
      .status(401)
      .json({
        error: { code: 'UNAUTHENTICATED', message: 'Session invalid.' },
      });
  }
  res.json({ id: staff.id, email: staff.email });
});

app.use('/api/staff', staffRouter);
