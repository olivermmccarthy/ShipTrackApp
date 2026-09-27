# ShipTrack

ShipTrack is a full-stack shipment tracking app. Customers can look up a shipment and send an enquiry; staff can manage shipments, tracking events, internal notes, and enquiries.

## Stack

- Client: React, TypeScript, Vite, and Leaflet
- Server: Express 5, TypeScript, and Prisma
- Database: PostgreSQL
- Maps: OpenStreetMap raster tiles

The Vite development server proxies `/api` requests to the Express server on port `3001`. In production, Express serves the built client from `client/dist` as well as the API.

## Requirements

- Node.js 24 or newer
- npm
- A PostgreSQL database

## Local Development

1. Configure the server environment:

   ```powershell
   cd server
   Copy-Item .env.example .env
   ```

   Edit `server/.env` and set:

   - `DATABASE_URL` to your PostgreSQL connection string
   - `JWT_SECRET` to a long, random secret
   - `SEED_STAFF_EMAIL` and `SEED_STAFF_PASSWORD` for the demo staff login

2. Install server dependencies, generate Prisma Client, apply migrations, and load demo data:

   ```powershell
   npm install
   npx prisma generate
   npx prisma migrate deploy
   npx tsx prisma/seed.ts
   npm run dev
   ```

   The server listens on `http://localhost:3001`.

   Seeding is intended for a fresh or disposable development database. It creates demo shipments and a staff account, and replaces all enquiries and internal notes with demo records. Do not run it against production data.

3. In a second terminal, start the client:

   ```powershell
   cd client
   npm install
   npm run dev
   ```

   Open the local URL printed by Vite (usually `http://localhost:5173`). The demo tracking numbers include `TRK-DEMO-001` through `TRK-DEMO-005`.

## Scripts

Run each command from its package directory (`client` or `server`).

| Package | Command | Description |
| --- | --- | --- |
| Client | `npm run dev` | Start the Vite development server |
| Client | `npm run build` | Type-check and build the production client |
| Client | `npm test` | Run client tests |
| Client | `npm run lint` | Lint client code |
| Server | `npm run dev` | Start the API with file watching |
| Server | `npm start` | Start the API for production |
| Server | `npm test` | Run API tests |

Server tests require a migrated database and the demo staff account/data. Set `DATABASE_URL`, `JWT_SECRET`, `SEED_STAFF_EMAIL`, and `SEED_STAFF_PASSWORD` in `server/.env` before running them.

## API Overview

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Health check |
| `GET` | `/api/shipments/:trackingNumber` | Public shipment tracking details and events |
| `POST` | `/api/enquiries` | Submit a customer enquiry |
| `POST` | `/api/auth/login` | Sign in staff and set an HTTP-only session cookie |
| `POST` | `/api/auth/logout` | Sign out staff |
| `GET` | `/api/staff/*` | Authenticated staff operations for shipments, events, notes, and enquiries |

Staff sessions use a signed cookie and expire after four hours.

## Render Deployment

Deploy the repository as a Node web service with the repository root as its root directory. Build the client and generate Prisma Client during the build; apply database migrations before the service starts.

- Build command: `cd client && npm ci && npm run build && cd ../server && npm ci && npx prisma generate`
- Pre-deploy command: `cd server && npx prisma migrate deploy`
- Start command: `cd server && npm start`

Configure these environment variables in Render:

- `DATABASE_URL`: production PostgreSQL connection string
- `JWT_SECRET`: long, random production secret
- `NODE_ENV`: `production` (enables secure staff session cookies)

Only set `SEED_STAFF_EMAIL` and `SEED_STAFF_PASSWORD` if you intend to run the demo seed manually. Never run the demo seed on production data. Render supplies `PORT` to the server.

The map loads tiles directly from OpenStreetMap and displays the required attribution. Its standard tile service is best-effort and subject to the [OpenStreetMap tile usage policy](https://operations.osmfoundation.org/policies/tiles/); for a production service that needs guaranteed availability, use a hosted tile provider.
