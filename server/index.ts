import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import { prisma } from './src/db.js';

const app = express();
app.use(helmet());
app.use(express.json());

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
    return res
      .status(404)
      .json({
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
