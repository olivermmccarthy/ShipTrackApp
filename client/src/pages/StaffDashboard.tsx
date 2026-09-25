import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

type ShipmentSummary = {
  id: string;
  trackingNumber: string;
  status: string;
  origin: string;
  destination: string;
  estimatedDelivery: string;
  updatedAt: string;
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

export default function StaffDashboard() {
  const [shipments, setShipments] = useState<ShipmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  async function load() {
    setLoading(true);
    setError(false);
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (status) params.set('status', status);

    try {
      const res = await fetch(`/api/staff/shipments?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setShipments(data.shipments);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFilterSubmit(e: React.FormEvent) {
    e.preventDefault();
    load();
  }

  return (
    <div>
      <div className="dashboard-header">
        <h1>Shipments</h1>
        <button
          type="button"
          aria-expanded={showCreate}
          aria-controls="create-shipment-form"
          onClick={() => setShowCreate((v) => !v)}
        >
          {showCreate ? 'Cancel' : 'Create shipment'}
        </button>
      </div>

      {showCreate && (
        <CreateShipmentForm
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}

      <form onSubmit={handleFilterSubmit} className="filter-bar">
        <div className="search-input-wrap">
          <input
            placeholder="Search tracking number…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button
              type="button"
              className="clear-btn"
              aria-label="Clear search"
              onClick={() => setQ('')}
            >
              ×
            </button>
          )}
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button type="submit">Apply</button>
      </form>

      {loading && (
        <p className="hint" role="status" aria-live="polite">
          Loading shipments…
        </p>
      )}
      {error && (
        <p className="error-message" role="alert">
          Couldn't load shipments. Please try again.
        </p>
      )}
      {!loading && !error && shipments.length === 0 && (
        <p className="hint">No shipments match your search.</p>
      )}

      {!loading && !error && shipments.length > 0 && (
        <div className="shipment-cards">
          {shipments.map((s) => (
            <Link
              to={`/staff/shipments/${s.id}`}
              key={s.id}
              className="shipment-card"
            >
              <div className="shipment-card-top">
                <span className="shipment-card-tracking">
                  {s.trackingNumber}
                </span>
                <span
                  className={`status-pill status-${s.status.toLowerCase()}`}
                >
                  {STATUS_LABELS[s.status] ?? s.status}
                </span>
              </div>
              <div className="shipment-card-route">
                {s.origin} → {s.destination}
              </div>
              <div className="shipment-card-meta">
                ETA {new Date(s.estimatedDelivery).toLocaleDateString('en-GB')}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateShipmentForm({ onCreated }: { onCreated: () => void }) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

   async function handleSubmit(e: React.FormEvent) {
     e.preventDefault();
     setSubmitting(true);
     setError(null);
     setFieldErrors({});

     try {
       const res = await fetch('/api/staff/shipments', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           origin,
           destination,
           currentLocation,
           estimatedDelivery: new Date(estimatedDelivery).toISOString(),
         }),
       });
       if (!res.ok) {
         const data = await res.json().catch(() => null);
         setError(data?.error?.message ?? "Couldn't create shipment.");
         setFieldErrors(data?.error?.fields ?? {});
         return;
       }
       onCreated();
     } finally {
       setSubmitting(false);
     }
   }

  return (
      <form
        id="create-shipment-form"
        onSubmit={handleSubmit}
        className="create-form"
      >
      <h2>New shipment</h2>
      <label htmlFor="origin">Origin</label>
      <input
        id="origin"
        aria-invalid={Boolean(fieldErrors.origin)}
        aria-describedby={fieldErrors.origin ? 'create-origin-error' : undefined}
        value={origin}
        onChange={(e) => setOrigin(e.target.value)}
        required
      />
      {fieldErrors.origin && (
        <p className="field-error" id="create-origin-error">
          {fieldErrors.origin[0]}
        </p>
      )}

      <label htmlFor="destination">Destination</label>
      <input
        id="destination"
        aria-invalid={Boolean(fieldErrors.destination)}
        aria-describedby={fieldErrors.destination ? 'create-destination-error' : undefined}
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        required
      />
      {fieldErrors.destination && (
        <p className="field-error" id="create-destination-error">
          {fieldErrors.destination[0]}
        </p>
      )}

      <label htmlFor="currentLocation">Current location</label>
      <input
        id="currentLocation"
        aria-invalid={Boolean(fieldErrors.currentLocation)}
        aria-describedby={fieldErrors.currentLocation ? 'create-location-error' : undefined}
        value={currentLocation}
        onChange={(e) => setCurrentLocation(e.target.value)}
        required
      />
      {fieldErrors.currentLocation && (
        <p className="field-error" id="create-location-error">
          {fieldErrors.currentLocation[0]}
        </p>
      )}

      <label htmlFor="estimatedDelivery">Estimated delivery</label>
      <input
        id="estimatedDelivery"
        type="date"
        aria-invalid={Boolean(fieldErrors.estimatedDelivery)}
        aria-describedby={fieldErrors.estimatedDelivery ? 'create-delivery-error' : undefined}
        value={estimatedDelivery}
        onChange={(e) => setEstimatedDelivery(e.target.value)}
        required
      />
      {fieldErrors.estimatedDelivery && (
        <p className="field-error" id="create-delivery-error">
          {fieldErrors.estimatedDelivery[0]}
        </p>
      )}

      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Creating…' : 'Create shipment'}
      </button>
    </form>
  );
}
