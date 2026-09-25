import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

type Event = {
  id: string;
  status: string;
  location: string;
  message: string;
  occurredAt: string;
};
type Note = { id: string; body: string; createdAt: string };
type ShipmentDetail = {
  id: string;
  trackingNumber: string;
  status: string;
  origin: string;
  destination: string;
  currentLocation: string;
  estimatedDelivery: string;
  originalEstimatedDelivery: string;
  details: Record<string, string | number>;
  events: Event[];
  notes: Note[];
};

const STATUS_LABELS: Record<string, string> = {
  CREATED: 'Created',
  COLLECTED: 'Collected',
  IN_TRANSIT: 'In Transit',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  DELAYED: 'Delayed',
  EXCEPTION: 'Exception',
};
const STATUS_VALUES = Object.keys(STATUS_LABELS);

export default function ShipmentDetailPage() {
  const { id } = useParams();
  const [shipment, setShipment] = useState<ShipmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/staff/shipments/${id}`);
      if (!res.ok) throw new Error();
      setShipment(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading)
    return (
      <p className="hint" role="status" aria-live="polite">
        Loading shipment…
      </p>
    );
  if (error || !shipment)
    return (
      <p className="error-message" role="alert">
        Couldn't load this shipment.
      </p>
    );

  return (
    <div>
      <Link to="/staff" className="back-link">
        ← Back to shipments
      </Link>
      <div className="detail-header">
        <h1>{shipment.trackingNumber}</h1>
        <span className={`status-pill status-${shipment.status.toLowerCase()}`}>
          {STATUS_LABELS[shipment.status] ?? shipment.status}
        </span>
      </div>

      <EditDetailsForm shipment={shipment} onSaved={load} />
      <AddEventForm shipmentId={shipment.id} onAdded={load} />

      <h2>Tracking history</h2>
      <ol className="timeline">
        {[...shipment.events].reverse().map((e) => (
          <li key={e.id}>
            <div className="timeline-date">
              {new Date(e.occurredAt).toLocaleString('en-GB')}
            </div>
            <div className="timeline-status">
              {STATUS_LABELS[e.status] ?? e.status}
            </div>
            <div className="timeline-location">{e.location}</div>
            <div className="timeline-message">{e.message}</div>
          </li>
        ))}
      </ol>

      <NotesSection
        shipmentId={shipment.id}
        notes={shipment.notes}
        onAdded={load}
      />
    </div>
  );
}

function EditDetailsForm({
  shipment,
  onSaved,
}: {
  shipment: ShipmentDetail;
  onSaved: () => void;
}) {
  const [origin, setOrigin] = useState(shipment.origin);
  const [destination, setDestination] = useState(shipment.destination);
  const [currentLocation, setCurrentLocation] = useState(
    shipment.currentLocation,
  );
  const [estimatedDelivery, setEstimatedDelivery] = useState(
    shipment.estimatedDelivery.slice(0, 10),
  );
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSaved(false);
    setFieldErrors({});
    try {
      const res = await fetch(`/api/staff/shipments/${shipment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          destination,
          currentLocation,
          estimatedDelivery: new Date(estimatedDelivery).toISOString(),
        }),
      });
      if (res.ok) {
        setSaved(true);
        onSaved();
      } else {
        const data = await res.json().catch(() => null);
        setFieldErrors(data?.error?.fields ?? {});
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="panel">
      <h2>Shipment details</h2>
      <label htmlFor="origin">Origin</label>
      <input
        id="origin"
        aria-invalid={Boolean(fieldErrors.origin)}
        aria-describedby={fieldErrors.origin ? 'edit-origin-error' : undefined}
        value={origin}
        onChange={(e) => setOrigin(e.target.value)}
        required
      />
      {fieldErrors.origin && (
        <p className="field-error" id="edit-origin-error">
          {fieldErrors.origin[0]}
        </p>
      )}

      <label htmlFor="destination">Destination</label>
      <input
        id="destination"
        aria-invalid={Boolean(fieldErrors.destination)}
        aria-describedby={fieldErrors.destination ? 'edit-destination-error' : undefined}
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        required
      />
      {fieldErrors.destination && (
        <p className="field-error" id="edit-destination-error">
          {fieldErrors.destination[0]}
        </p>
      )}

      <label htmlFor="currentLocation">Current location</label>
      <input
        id="currentLocation"
        aria-invalid={Boolean(fieldErrors.currentLocation)}
        aria-describedby={fieldErrors.currentLocation ? 'edit-location-error' : undefined}
        value={currentLocation}
        onChange={(e) => setCurrentLocation(e.target.value)}
        required
      />
      {fieldErrors.currentLocation && (
        <p className="field-error" id="edit-location-error">
          {fieldErrors.currentLocation[0]}
        </p>
      )}

      <label htmlFor="estimatedDelivery">Estimated delivery</label>
      <input
        id="estimatedDelivery"
        type="date"
        aria-invalid={Boolean(fieldErrors.estimatedDelivery)}
        aria-describedby={fieldErrors.estimatedDelivery ? 'edit-delivery-error' : undefined}
        value={estimatedDelivery}
        onChange={(e) => setEstimatedDelivery(e.target.value)}
        required
      />
      {fieldErrors.estimatedDelivery && (
        <p className="field-error" id="edit-delivery-error">
          {fieldErrors.estimatedDelivery[0]}
        </p>
      )}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Saving…' : 'Save details'}
      </button>
      {saved && (
        <span className="save-confirm" role="status">
          {' '}
          Saved.
        </span>
      )}
    </form>
  );
}

function AddEventForm({
  shipmentId,
  onAdded,
}: {
  shipmentId: string;
  onAdded: () => void;
}) {
  const [status, setStatus] = useState('IN_TRANSIT');
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');
  const [newEta, setNewEta] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    try {
      const res = await fetch(`/api/staff/shipments/${shipmentId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          location,
          message,
          ...(newEta
            ? { newEstimatedDelivery: new Date(newEta).toISOString() }
            : {}),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error?.message ?? "Couldn't add event.");
        setFieldErrors(data?.error?.fields ?? {});
        return;
      }
      setLocation('');
      setMessage('');
      setNewEta('');
      onAdded();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="panel">
      <h2>Add tracking event</h2>
      <label htmlFor="eventStatus">Status</label>
      <select
        id="eventStatus"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        {STATUS_VALUES.map((v) => (
          <option key={v} value={v}>
            {STATUS_LABELS[v]}
          </option>
        ))}
      </select>

      <label htmlFor="eventLocation">Location</label>
      <input
        id="eventLocation"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        required
      />
      {fieldErrors.location && (
        <p className="field-error">{fieldErrors.location[0]}</p>
      )}

      <label htmlFor="eventMessage">Message</label>
      <textarea
        id="eventMessage"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={2}
        required
      />
      {fieldErrors.message && (
        <p className="field-error">{fieldErrors.message[0]}</p>
      )}

      {status === 'DELAYED' && (
        <>
          <label htmlFor="newEta">New estimated delivery (optional)</label>
          <input
            id="newEta"
            type="date"
            value={newEta}
            onChange={(e) => setNewEta(e.target.value)}
          />
        </>
      )}

      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Adding…' : 'Add event'}
      </button>
    </form>
  );
}

function NotesSection({
  shipmentId,
  notes,
  onAdded,
}: {
  shipmentId: string;
  notes: Note[];
  onAdded: () => void;
}) {
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      await fetch(`/api/staff/shipments/${shipmentId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      setBody('');
      onAdded();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="panel">
      <h2>Internal notes</h2>
      <p className="hint">Not visible to customers.</p>
      {notes.length === 0 && <p className="hint">No notes yet.</p>}
      <ul className="notes-list">
        {notes.map((n) => (
          <li key={n.id}>
            <div className="timeline-date">
              {new Date(n.createdAt).toLocaleString('en-GB')}
            </div>
            <div>{n.body}</div>
          </li>
        ))}
      </ul>
      <form onSubmit={handleSubmit}>
        <label htmlFor="internal-note">Note</label>
        <textarea
          id="internal-note"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder="Add an internal note…"
        />
        <button type="submit" disabled={submitting}>
          {submitting ? 'Adding…' : 'Add note'}
        </button>
      </form>
    </div>
  );
}
