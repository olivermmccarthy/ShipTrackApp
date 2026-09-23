import 'dotenv/config';
import { prisma } from '../src/db.js';
import { ShipmentStatus, EnquiryState } from '../generated/prisma/client.js';

type SeedEvent = {
  status: ShipmentStatus;
  location: string;
  message: string;
  occurredAt: string;
};

type SeedShipment = {
  trackingNumber: string;
  status: ShipmentStatus;
  origin: string;
  destination: string;
  estimatedDelivery: string;
  originalEstimatedDelivery: string;
  currentLocation: string;
  details: Record<string, string | number>;
  events: SeedEvent[];
};

const shipments: SeedShipment[] = [
  {
    trackingNumber: 'TRK-DEMO-001',
    status: ShipmentStatus.IN_TRANSIT,
    origin: 'Manchester, UK',
    destination: 'Berlin, Germany',
    estimatedDelivery: '2026-09-28',
    originalEstimatedDelivery: '2026-09-28',
    currentLocation: 'Rotterdam, Netherlands',
    details: { service: 'Standard Freight', packageCount: 2, weightKg: 14.5 },
    events: [
      {
        status: ShipmentStatus.CREATED,
        location: 'Manchester, UK',
        message: 'Shipment created and awaiting collection.',
        occurredAt: '2026-09-20T09:00:00Z',
      },
      {
        status: ShipmentStatus.COLLECTED,
        location: 'Manchester, UK',
        message: 'Package collected from sender.',
        occurredAt: '2026-09-20T14:30:00Z',
      },
      {
        status: ShipmentStatus.IN_TRANSIT,
        location: 'Dover, UK',
        message: 'Departed UK, en route to mainland Europe.',
        occurredAt: '2026-09-21T08:00:00Z',
      },
      {
        status: ShipmentStatus.IN_TRANSIT,
        location: 'Rotterdam, Netherlands',
        message: 'Arrived at Rotterdam distribution hub.',
        occurredAt: '2026-09-22T06:15:00Z',
      },
    ],
  },
  {
    trackingNumber: 'TRK-DEMO-002',
    status: ShipmentStatus.DELIVERED,
    origin: 'Bristol, UK',
    destination: 'Dublin, Ireland',
    estimatedDelivery: '2026-09-21',
    originalEstimatedDelivery: '2026-09-21',
    currentLocation: 'Dublin, Ireland',
    details: { service: 'Express', packageCount: 1, weightKg: 3.2 },
    events: [
      {
        status: ShipmentStatus.CREATED,
        location: 'Bristol, UK',
        message: 'Shipment created and awaiting collection.',
        occurredAt: '2026-09-18T09:00:00Z',
      },
      {
        status: ShipmentStatus.COLLECTED,
        location: 'Bristol, UK',
        message: 'Package collected from sender.',
        occurredAt: '2026-09-18T13:00:00Z',
      },
      {
        status: ShipmentStatus.IN_TRANSIT,
        location: 'Holyhead, UK',
        message: 'Departed UK by ferry.',
        occurredAt: '2026-09-19T07:00:00Z',
      },
      {
        status: ShipmentStatus.OUT_FOR_DELIVERY,
        location: 'Dublin, Ireland',
        message: 'Out for delivery with local courier.',
        occurredAt: '2026-09-21T08:30:00Z',
      },
      {
        status: ShipmentStatus.DELIVERED,
        location: 'Dublin, Ireland',
        message: 'Delivered and signed for by recipient.',
        occurredAt: '2026-09-21T11:45:00Z',
      },
    ],
  },
  {
    trackingNumber: 'TRK-DEMO-003',
    status: ShipmentStatus.DELAYED,
    origin: 'Leeds, UK',
    destination: 'Madrid, Spain',
    estimatedDelivery: '2026-09-30',
    originalEstimatedDelivery: '2026-09-25',
    currentLocation: 'Bordeaux, France',
    details: { service: 'Standard Freight', packageCount: 3, weightKg: 22.0 },
    events: [
      {
        status: ShipmentStatus.CREATED,
        location: 'Leeds, UK',
        message: 'Shipment created and awaiting collection.',
        occurredAt: '2026-09-19T09:00:00Z',
      },
      {
        status: ShipmentStatus.COLLECTED,
        location: 'Leeds, UK',
        message: 'Package collected from sender.',
        occurredAt: '2026-09-19T15:00:00Z',
      },
      {
        status: ShipmentStatus.IN_TRANSIT,
        location: 'Dover, UK',
        message: 'Departed UK, en route to mainland Europe.',
        occurredAt: '2026-09-20T08:00:00Z',
      },
      {
        status: ShipmentStatus.DELAYED,
        location: 'Bordeaux, France',
        message:
          'Delayed at customs due to incomplete paperwork. Estimated delivery date has been updated.',
        occurredAt: '2026-09-23T10:00:00Z',
      },
    ],
  },
  {
    trackingNumber: 'TRK-DEMO-004',
    status: ShipmentStatus.EXCEPTION,
    origin: 'Glasgow, UK',
    destination: 'Paris, France',
    estimatedDelivery: '2026-09-26',
    originalEstimatedDelivery: '2026-09-26',
    currentLocation: 'Paris, France',
    details: { service: 'Standard Freight', packageCount: 1, weightKg: 6.8 },
    events: [
      {
        status: ShipmentStatus.CREATED,
        location: 'Glasgow, UK',
        message: 'Shipment created and awaiting collection.',
        occurredAt: '2026-09-19T09:00:00Z',
      },
      {
        status: ShipmentStatus.COLLECTED,
        location: 'Glasgow, UK',
        message: 'Package collected from sender.',
        occurredAt: '2026-09-19T16:00:00Z',
      },
      {
        status: ShipmentStatus.IN_TRANSIT,
        location: 'Paris, France',
        message: 'Arrived at Paris distribution hub.',
        occurredAt: '2026-09-21T09:00:00Z',
      },
      {
        status: ShipmentStatus.EXCEPTION,
        location: 'Paris, France',
        message:
          'Delivery address appears incomplete. Attempting to contact recipient before re-attempting delivery.',
        occurredAt: '2026-09-22T13:20:00Z',
      },
    ],
  },
  {
    trackingNumber: 'TRK-DEMO-005',
    status: ShipmentStatus.COLLECTED,
    origin: 'Coventry, UK',
    destination: 'Amsterdam, Netherlands',
    estimatedDelivery: '2026-09-29',
    originalEstimatedDelivery: '2026-09-29',
    currentLocation: 'Coventry, UK',
    details: { service: 'Standard Freight', packageCount: 1, weightKg: 5.0 },
    events: [
      {
        status: ShipmentStatus.CREATED,
        location: 'Coventry, UK',
        message: 'Shipment created and awaiting collection.',
        occurredAt: '2026-09-22T09:00:00Z',
      },
      {
        status: ShipmentStatus.COLLECTED,
        location: 'Coventry, UK',
        message: 'Package collected from sender.',
        occurredAt: '2026-09-22T15:30:00Z',
      },
    ],
  },
  {
    trackingNumber: 'TRK-EXTRA-101',
    status: ShipmentStatus.IN_TRANSIT,
    origin: 'Liverpool, UK',
    destination: 'Rome, Italy',
    estimatedDelivery: '2026-09-29',
    originalEstimatedDelivery: '2026-09-29',
    currentLocation: 'Lyon, France',
    details: { service: 'Standard Freight', packageCount: 2, weightKg: 9.4 },
    events: [
      {
        status: ShipmentStatus.CREATED,
        location: 'Liverpool, UK',
        message: 'Shipment created and awaiting collection.',
        occurredAt: '2026-09-20T09:00:00Z',
      },
      {
        status: ShipmentStatus.COLLECTED,
        location: 'Liverpool, UK',
        message: 'Package collected from sender.',
        occurredAt: '2026-09-20T14:00:00Z',
      },
      {
        status: ShipmentStatus.IN_TRANSIT,
        location: 'Lyon, France',
        message: 'In transit through European network.',
        occurredAt: '2026-09-22T11:00:00Z',
      },
    ],
  },
  {
    trackingNumber: 'TRK-EXTRA-102',
    status: ShipmentStatus.DELIVERED,
    origin: 'Southampton, UK',
    destination: 'Lisbon, Portugal',
    estimatedDelivery: '2026-09-20',
    originalEstimatedDelivery: '2026-09-20',
    currentLocation: 'Lisbon, Portugal',
    details: { service: 'Express', packageCount: 1, weightKg: 1.9 },
    events: [
      {
        status: ShipmentStatus.CREATED,
        location: 'Southampton, UK',
        message: 'Shipment created and awaiting collection.',
        occurredAt: '2026-09-17T09:00:00Z',
      },
      {
        status: ShipmentStatus.COLLECTED,
        location: 'Southampton, UK',
        message: 'Package collected from sender.',
        occurredAt: '2026-09-17T13:00:00Z',
      },
      {
        status: ShipmentStatus.OUT_FOR_DELIVERY,
        location: 'Lisbon, Portugal',
        message: 'Out for delivery with local courier.',
        occurredAt: '2026-09-20T08:00:00Z',
      },
      {
        status: ShipmentStatus.DELIVERED,
        location: 'Lisbon, Portugal',
        message: 'Delivered and signed for by recipient.',
        occurredAt: '2026-09-20T10:15:00Z',
      },
    ],
  },
  {
    trackingNumber: 'TRK-EXTRA-103',
    status: ShipmentStatus.OUT_FOR_DELIVERY,
    origin: 'Coventry, UK',
    destination: 'Brussels, Belgium',
    estimatedDelivery: '2026-09-23',
    originalEstimatedDelivery: '2026-09-23',
    currentLocation: 'Brussels, Belgium',
    details: { service: 'Express', packageCount: 1, weightKg: 2.5 },
    events: [
      {
        status: ShipmentStatus.CREATED,
        location: 'Coventry, UK',
        message: 'Shipment created and awaiting collection.',
        occurredAt: '2026-09-21T09:00:00Z',
      },
      {
        status: ShipmentStatus.COLLECTED,
        location: 'Coventry, UK',
        message: 'Package collected from sender.',
        occurredAt: '2026-09-21T14:00:00Z',
      },
      {
        status: ShipmentStatus.IN_TRANSIT,
        location: 'Brussels, Belgium',
        message: 'Arrived at Brussels distribution hub.',
        occurredAt: '2026-09-22T20:00:00Z',
      },
      {
        status: ShipmentStatus.OUT_FOR_DELIVERY,
        location: 'Brussels, Belgium',
        message: 'Out for delivery with local courier.',
        occurredAt: '2026-09-23T07:30:00Z',
      },
    ],
  },
  {
    trackingNumber: 'TRK-EXTRA-104',
    status: ShipmentStatus.DELAYED,
    origin: 'Cardiff, UK',
    destination: 'Copenhagen, Denmark',
    estimatedDelivery: '2026-10-02',
    originalEstimatedDelivery: '2026-09-27',
    currentLocation: 'Hamburg, Germany',
    details: { service: 'Standard Freight', packageCount: 4, weightKg: 31.0 },
    events: [
      {
        status: ShipmentStatus.CREATED,
        location: 'Cardiff, UK',
        message: 'Shipment created and awaiting collection.',
        occurredAt: '2026-09-18T09:00:00Z',
      },
      {
        status: ShipmentStatus.COLLECTED,
        location: 'Cardiff, UK',
        message: 'Package collected from sender.',
        occurredAt: '2026-09-18T16:00:00Z',
      },
      {
        status: ShipmentStatus.IN_TRANSIT,
        location: 'Hamburg, Germany',
        message: 'Arrived at Hamburg hub.',
        occurredAt: '2026-09-21T10:00:00Z',
      },
      {
        status: ShipmentStatus.DELAYED,
        location: 'Hamburg, Germany',
        message:
          'Delayed due to high network volume. Estimated delivery date has been updated.',
        occurredAt: '2026-09-23T09:00:00Z',
      },
    ],
  },
  {
    trackingNumber: 'TRK-EXTRA-105',
    status: ShipmentStatus.EXCEPTION,
    origin: 'Edinburgh, UK',
    destination: 'Vienna, Austria',
    estimatedDelivery: '2026-09-27',
    originalEstimatedDelivery: '2026-09-27',
    currentLocation: 'Vienna, Austria',
    details: { service: 'Standard Freight', packageCount: 1, weightKg: 4.1 },
    events: [
      {
        status: ShipmentStatus.CREATED,
        location: 'Edinburgh, UK',
        message: 'Shipment created and awaiting collection.',
        occurredAt: '2026-09-19T09:00:00Z',
      },
      {
        status: ShipmentStatus.COLLECTED,
        location: 'Edinburgh, UK',
        message: 'Package collected from sender.',
        occurredAt: '2026-09-19T15:00:00Z',
      },
      {
        status: ShipmentStatus.IN_TRANSIT,
        location: 'Vienna, Austria',
        message: 'Arrived at Vienna distribution hub.',
        occurredAt: '2026-09-22T12:00:00Z',
      },
      {
        status: ShipmentStatus.EXCEPTION,
        location: 'Vienna, Austria',
        message:
          'Package appears damaged in transit. Awaiting instructions from sender.',
        occurredAt: '2026-09-23T08:45:00Z',
      },
    ],
  },
  {
    trackingNumber: 'TRK-EXTRA-106',
    status: ShipmentStatus.CREATED,
    origin: 'Newcastle, UK',
    destination: 'Prague, Czech Republic',
    estimatedDelivery: '2026-10-01',
    originalEstimatedDelivery: '2026-10-01',
    currentLocation: 'Newcastle, UK',
    details: { service: 'Standard Freight', packageCount: 1, weightKg: 7.3 },
    events: [
      {
        status: ShipmentStatus.CREATED,
        location: 'Newcastle, UK',
        message: 'Shipment created and awaiting collection.',
        occurredAt: '2026-09-23T09:00:00Z',
      },
    ],
  },
];

const enquiries = [
  {
    trackingNumber: 'TRK-DEMO-001',
    category: 'Delivery Time',
    message: 'Can you confirm if this will still arrive by Monday?',
    state: EnquiryState.OPEN,
  },
  {
    trackingNumber: 'TRK-DEMO-003',
    category: 'Delay',
    message: 'Why has my delivery date changed? I need this fairly urgently.',
    state: EnquiryState.OPEN,
  },
  {
    trackingNumber: 'TRK-DEMO-004',
    category: 'Address Issue',
    message:
      'I think the address on file might be wrong, please could someone call me.',
    state: EnquiryState.OPEN,
  },
  {
    trackingNumber: 'TRK-DEMO-002',
    category: 'General Question',
    message:
      'Thanks for the quick delivery, just confirming it arrived safely.',
    state: EnquiryState.RESOLVED,
  },
  {
    trackingNumber: 'TRK-EXTRA-105',
    category: 'Damaged Item',
    message: 'The box looked damaged in the last update, is my item okay?',
    state: EnquiryState.OPEN,
  },
];

async function main() {
  const shipmentIds: Record<string, string> = {};

  for (const s of shipments) {
    const shipment = await prisma.shipment.upsert({
      where: { trackingNumber: s.trackingNumber },
      update: {},
      create: {
        trackingNumber: s.trackingNumber,
        status: s.status,
        origin: s.origin,
        destination: s.destination,
        estimatedDelivery: new Date(s.estimatedDelivery),
        originalEstimatedDelivery: new Date(s.originalEstimatedDelivery),
        currentLocation: s.currentLocation,
        details: s.details,
        events: {
          create: s.events.map((e) => ({
            status: e.status,
            location: e.location,
            message: e.message,
            occurredAt: new Date(e.occurredAt),
          })),
        },
      },
    });
    shipmentIds[s.trackingNumber] = shipment.id;
    console.log('Seeded shipment:', shipment.trackingNumber);
  }

  // Enquiries and notes don't have a natural unique field to upsert on,
  // so we clear and recreate them each run to keep the script repeatable.
  await prisma.enquiry.deleteMany({});
  await prisma.internalNote.deleteMany({});

  for (const e of enquiries) {
    await prisma.enquiry.create({ data: e });
  }
  console.log(`Seeded ${enquiries.length} enquiries`);

  await prisma.internalNote.create({
    data: {
      shipmentId: shipmentIds['TRK-DEMO-004'],
      body: 'Customer has called twice about this. Prioritise the callback once contact details are confirmed.',
    },
  });
  await prisma.internalNote.create({
    data: {
      shipmentId: shipmentIds['TRK-DEMO-003'],
      body: "Awaiting confirmation from carrier on customs paperwork, don't promise a firm new ETA until confirmed.",
    },
  });
  console.log('Seeded internal notes');
}

main()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
