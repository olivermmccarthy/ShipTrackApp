import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { prisma } from './db.js';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Router } from 'express';
import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAuth, type AuthedRequest } from './middleware/requireAuth.js';

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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.join(__dirname, '../../client/dist');

app.use(express.static(clientDist));

app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
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
    return res.status(401).json({
      error: { code: 'UNAUTHENTICATED', message: 'Session invalid.' },
    });
  }
  res.json({ id: staff.id, email: staff.email });
});

const STATUS_VALUES = [
  'CREATED',
  'COLLECTED',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'DELAYED',
  'EXCEPTION',
] as const;

function generateTrackingNumber() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i++)
    suffix += chars[Math.floor(Math.random() * chars.length)];
  return `TRK-${suffix}`;
}

// GET /api/staff/shipments — list, search by tracking number, filter by status
staffRouter.get('/shipments', async (req, res) => {
  const { q, status } = req.query;

  const shipments = await prisma.shipment.findMany({
    where: {
      ...(typeof q === 'string' && q.trim()
        ? { trackingNumber: { contains: q.trim().toUpperCase() } }
        : {}),
      ...(typeof status === 'string' && STATUS_VALUES.includes(status as any)
        ? { status: status as any }
        : {}),
    },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      trackingNumber: true,
      status: true,
      origin: true,
      destination: true,
      estimatedDelivery: true,
      updatedAt: true,
    },
  });

  res.json({ shipments });
});

// GET /api/staff/shipments/:id — full detail including events and internal notes
staffRouter.get('/shipments/:id', async (req, res) => {
  const shipment = await prisma.shipment.findUnique({
    where: { id: req.params.id },
    include: {
      events: { orderBy: { occurredAt: 'asc' } },
      notes: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!shipment) {
    return res
      .status(404)
      .json({ error: { code: 'NOT_FOUND', message: 'Shipment not found.' } });
  }

  res.json(shipment);
});

const createShipmentSchema = z.object({
  trackingNumber: z.string().trim().min(1).optional(),
  origin: z.string().trim().min(1),
  destination: z.string().trim().min(1),
  estimatedDelivery: z.string().datetime().or(z.string().min(1)),
  currentLocation: z.string().trim().min(1),
  details: z.record(z.union([z.string(), z.number()])).optional(),
});

// POST /api/staff/shipments — create
staffRouter.post('/shipments', async (req, res) => {
  const parsed = createShipmentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid shipment data.',
        fields: parsed.error.flatten().fieldErrors,
      },
    });
  }
  const data = parsed.data;
  const trackingNumber = (
    data.trackingNumber ?? generateTrackingNumber()
  ).toUpperCase();

  const existing = await prisma.shipment.findUnique({
    where: { trackingNumber },
  });
  if (existing) {
    return res.status(409).json({
      error: {
        code: 'CONFLICT',
        message: `Tracking number ${trackingNumber} already exists.`,
      },
    });
  }

  const estimatedDelivery = new Date(data.estimatedDelivery);
  const shipment = await prisma.shipment.create({
    data: {
      trackingNumber,
      status: 'CREATED',
      origin: data.origin,
      destination: data.destination,
      estimatedDelivery,
      originalEstimatedDelivery: estimatedDelivery,
      currentLocation: data.currentLocation,
      details: data.details ?? {},
      events: {
        create: [
          {
            status: 'CREATED',
            location: data.currentLocation,
            message: 'Shipment created.',
            occurredAt: new Date(),
          },
        ],
      },
    },
  });

  res.status(201).json(shipment);
});

const editShipmentSchema = z.object({
  origin: z.string().trim().min(1).optional(),
  destination: z.string().trim().min(1).optional(),
  currentLocation: z.string().trim().min(1).optional(),
  estimatedDelivery: z.string().datetime().optional(),
  details: z.record(z.union([z.string(), z.number()])).optional(),
});

// PATCH /api/staff/shipments/:id — edit details (not status; status changes go through events)
staffRouter.patch('/shipments/:id', async (req, res) => {
  const parsed = editShipmentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid update data.',
        fields: parsed.error.flatten().fieldErrors,
      },
    });
  }

  const shipment = await prisma.shipment.findUnique({
    where: { id: req.params.id },
  });
  if (!shipment) {
    return res
      .status(404)
      .json({ error: { code: 'NOT_FOUND', message: 'Shipment not found.' } });
  }

  const { estimatedDelivery, ...rest } = parsed.data;
  const updated = await prisma.shipment.update({
    where: { id: req.params.id },
    data: {
      ...rest,
      ...(estimatedDelivery
        ? { estimatedDelivery: new Date(estimatedDelivery) }
        : {}),
    },
  });

  res.json(updated);
});

const addEventSchema = z.object({
  status: z.enum(STATUS_VALUES),
  location: z.string().trim().min(1),
  message: z.string().trim().min(1),
  occurredAt: z.string().datetime().optional(),
  newEstimatedDelivery: z.string().datetime().optional(),
});

// POST /api/staff/shipments/:id/events — add event; this is the only way status changes
staffRouter.post('/shipments/:id/events', async (req, res) => {
  const parsed = addEventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid event data.',
        fields: parsed.error.flatten().fieldErrors,
      },
    });
  }
  const data = parsed.data;

  const shipment = await prisma.shipment.findUnique({
    where: { id: req.params.id },
  });
  if (!shipment) {
    return res
      .status(404)
      .json({ error: { code: 'NOT_FOUND', message: 'Shipment not found.' } });
  }

  const occurredAt = data.occurredAt ? new Date(data.occurredAt) : new Date();
  if (occurredAt.getTime() > Date.now()) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Events cannot be dated in the future.',
      },
    });
  }

  const [, updatedShipment] = await prisma.$transaction([
    prisma.trackingEvent.create({
      data: {
        shipmentId: shipment.id,
        status: data.status,
        location: data.location,
        message: data.message,
        occurredAt,
      },
    }),
    prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        status: data.status,
        currentLocation: data.location,
        ...(data.newEstimatedDelivery
          ? { estimatedDelivery: new Date(data.newEstimatedDelivery) }
          : {}),
      },
    }),
  ]);

  res.status(201).json(updatedShipment);
});

// POST /api/staff/shipments/:id/notes — internal notes, never shown on the public endpoint
staffRouter.post('/shipments/:id/notes', async (req, res) => {
  const { body } = req.body;
  if (typeof body !== 'string' || !body.trim()) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Note body is required.' },
    });
  }

  const shipment = await prisma.shipment.findUnique({
    where: { id: req.params.id },
  });
  if (!shipment) {
    return res
      .status(404)
      .json({ error: { code: 'NOT_FOUND', message: 'Shipment not found.' } });
  }

  const note = await prisma.internalNote.create({
    data: { shipmentId: shipment.id, body },
  });
  res.status(201).json(note);
});

// GET /api/staff/enquiries — list
staffRouter.get('/enquiries', async (req, res) => {
  const enquiries = await prisma.enquiry.findMany({
    orderBy: { createdAt: 'desc' },
  });
  res.json({ enquiries });
});

// PATCH /api/staff/enquiries/:id — resolve / reopen
staffRouter.patch('/enquiries/:id', async (req, res) => {
  const { state } = req.body;
  if (state !== 'OPEN' && state !== 'RESOLVED') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'state must be OPEN or RESOLVED.',
      },
    });
  }

  const enquiry = await prisma.enquiry.findUnique({
    where: { id: req.params.id },
  });
  if (!enquiry) {
    return res
      .status(404)
      .json({ error: { code: 'NOT_FOUND', message: 'Enquiry not found.' } });
  }

  const updated = await prisma.enquiry.update({
    where: { id: req.params.id },
    data: { state },
  });
  res.json(updated);
});

app.use('/api/staff', staffRouter);
app.use('/api', (_req: Request, res: Response) => {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: 'No such API endpoint.' },
  });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong. Please try again.',
    },
  });
});
export default app;
