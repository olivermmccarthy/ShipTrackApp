# ShipTrack

Customers can look up a shipment by tracking number, no account needed. Staff log in to create and manage shipments, add tracking events, leave internal notes, and deal with customer enquiries.

**Live app:** https://shiptrackapp.onrender.com/
**Repo:** https://github.com/olivermmccarthy/ShipTrackApp

The free Render tier spins down after 15 minutes with no traffic, so the first load after a while can take 30-60 seconds to wake back up. After that it's fast.

## What it does

On the customer side, you enter a tracking number and get the current status, origin and destination, ETA (with the original ETA shown too if it's changed), current location, a progress tracker, a route map, and the full event history. Empty input, an unknown tracking number, and loading are all handled as their own states rather than one generic error. There's also a form to submit an enquiry against a shipment, category plus message, no account required.

On the staff side: log in, search and filter shipments, open one up to edit its details, add tracking events, and leave internal notes that never show up on the public page. There's also an enquiries screen to see what customers have asked and mark things resolved.

## Stack

React + TypeScript + Vite on the frontend, plain CSS. Node + Express 5 + TypeScript on the backend. Express serves the built React app itself in production, so it's one deployed service and I didn't have to deal with CORS.

Database is Postgres on Supabase.

Auth is bcrypt for passwords and a JWT in an httpOnly cookie, checked by a `requireAuth` middleware on every staff route. Validation is Zod on the routes that need it, plain checks where that's overkill. Tests are Vitest + Supertest on the backend and Vitest + React Testing Library on the frontend. The map is Leaflet with OpenStreetMap tiles and a lookup table mapping known city names to rough coordinates. CI is GitHub Actions, running both test suites on every push.

## Running it locally

You only need this if you want to run it on your own machine. The live app above already has its own database and is fully seeded, so the demo credentials below work straight away.

**You'll need:** Node 24 (that's what I built and tested on, and what CI runs), and a Postgres database, a free Supabase project is the easiest way to get one.

**1. Clone and install**

```bash
git clone https://github.com/olivermmccarthy/ShipTrackApp.git
cd ShipTrackApp

cd client && npm install && cd ..
cd server && npm install && cd ..
```

**2. Environment variables**

Copy `server/.env.example` to `server/.env` and fill it in.

**3. Run it**

Two terminals, both from the repo root:

```bash
# terminal 1
cd server && npm run dev
```

```bash
# terminal 2
cd client && npm run dev
```

Then go to `http://localhost:5173`.

**Staff login:** `demo.staff@example.test` / `ShipTrackDemo2026`

**Tracking numbers to try:**

| Tracking number | What it shows |
|---|---|
| TRK-DEMO-001 | In transit, a few events |
| TRK-DEMO-002 | Delivered |
| TRK-DEMO-003 | Delayed, ETA updated |
| TRK-DEMO-004 | Exception |
| TRK-DEMO-005 | Just collected |

There are also several `TRK-EXTRA-...` shipments seeded in, covering the same statuses, mainly so the staff search and filter have something to actually filter.

## Tests

The backend tests hit the real database, so `.env` needs to be filled in and the database seeded first.

```bash
cd server && npm test && cd ..
cd client && npm test
```

On the backend: the public tracking lookup, a 404 for an unknown tracking number, a rejected request with no session, a rejected login with the wrong password, a rejected enquiry missing a field, and one that specifically proves internal notes never show up on the public endpoint (it adds a note, checks it's not there, then deletes it again). On the frontend: the tracking form rejects an empty submission. It's not exhaustive coverage, but should cover the main points.

CI runs both suites on every push against the same Supabase database I develop against, not a separate test database. That's a shortcut given the time I had. It works because the seed script is safe to run more than once and the tests tidy up after themselves.

## API

REST, JSON. Errors always come back as `{ "error": { "code": "...", "message": "...", "fields"?: {...} } }`. Anything unexpected is caught by a global error handler and returns a plain 500, the real error only goes to the server log, never to the client.

**Public**
- `GET /api/shipments/:trackingNumber` - shipment summary and event history
- `POST /api/enquiries` - submit a customer enquiry

**Auth**
- `POST /api/auth/login`
- `POST /api/auth/logout`

**Staff** (every route below needs a valid session, 401 otherwise)
- `GET /api/staff/me`
- `GET /api/staff/shipments` - `?q=` searches by tracking number, `?status=` filters
- `GET /api/staff/shipments/:id` - full detail including internal notes
- `POST /api/staff/shipments` - create
- `PATCH /api/staff/shipments/:id` - edit origin, destination, current location, ETA, details (not status)
- `POST /api/staff/shipments/:id/events` - add a tracking event
- `POST /api/staff/shipments/:id/notes` - add an internal note
- `GET /api/staff/enquiries`
- `PATCH /api/staff/enquiries/:id` - set state to OPEN or RESOLVED

## Decisions worth explaining

Status only changes through tracking events. Adding an event updates the shipment's status, location, and optionally its ETA, all in one transaction. That means the status shown can never contradict its own history, and a Delivered shipment always has an actual Delivered event behind it. `PATCH /shipments/:id` deliberately can't touch status for this reason.

I left status transitions unrestricted, so technically you could move a Delivered shipment back to In Transit. The brief says "allow movement between supported statuses," and I read that as intentionally not wanting a strict state machine, so I didn't build one.

Events dated in the future are rejected with a 400 rather than allowed through.

Nothing's paginated. The staff shipment list and the enquiries list both return every row, and the enquiries open/resolved filter runs client-side rather than as a query param. Fine for a seeded dataset this size, not something I'd ship as-is against a real one.

Tracking numbers are `TRK-` plus six random characters when auto-generated. Duplicates get a 409.

Enquiries link to a shipment by tracking number, not by its internal ID, since that's the only thing a customer actually has.

Shipment `details` is a loose JSON field (service, package count,