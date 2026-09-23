import { useState } from 'react';

type Shipment = {
  trackingNumber: string;
  status: string;
  origin: string;
  destination: string;
  estimatedDelivery: string;
  originalEstimatedDelivery: string;
  currentLocation: string;
  details: Record<string, string | number>;
  events: {
    status: string;
    location: string;
    message: string;
    occurredAt: string;
  }[];
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

export default function TrackingPage() {
  const [input, setInput] = useState('');
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) {
      setError('Please enter a tracking number.');
      return;
    }

    setLoading(true);
    setError(null);
    setShipment(null);
    setSearched(true);

    try {
      const res = await fetch(`/api/shipments/${encodeURIComponent(trimmed)}`);
      if (res.status === 404) {
        setError(
          "We couldn't find a shipment with that tracking number. Please check and try again.",
        );
        return;
      }
      if (!res.ok) {
        setError(
          'Something went wrong looking up that shipment. Please try again.',
        );
        return;
      }
      const data = await res.json();
      setShipment(data);
    } catch {
      setError(
        'Something went wrong looking up that shipment. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="tracking-page">
      <h1>Track your shipment</h1>
      <form onSubmit={handleSearch} className="tracking-form">
        <label htmlFor="trackingNumber">Tracking number</label>
        <div className="tracking-form-row">
          <input
            id="trackingNumber"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. TRK-DEMO-001"
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Searching…' : 'Track'}
          </button>
        </div>
      </form>

      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      {shipment && <ShipmentResult shipment={shipment} />}

      {!shipment && !error && !loading && searched === false && (
        <p className="hint">
          Enter a tracking number above to see your shipment's status.
        </p>
      )}
    </div>
  );
}

function ShipmentResult({ shipment }: { shipment: Shipment }) {
  const isDelayed = shipment.status === 'DELAYED';
  const etaChanged =
    shipment.estimatedDelivery !== shipment.originalEstimatedDelivery;

  return (
    <div className="shipment-result">
      <div className={`status-banner status-${shipment.status.toLowerCase()}`}>
        <span className="status-label">
          {STATUS_LABELS[shipment.status] ?? shipment.status}
        </span>
      </div>

      <dl className="shipment-summary">
        <div>
          <dt>Tracking number</dt>
          <dd>{shipment.trackingNumber}</dd>
        </div>
        <div>
          <dt>From</dt>
          <dd>{shipment.origin}</dd>
        </div>
        <div>
          <dt>To</dt>
          <dd>{shipment.destination}</dd>
        </div>
        <div>
          <dt>Estimated delivery</dt>
          <dd>
            {formatDate(shipment.estimatedDelivery)}
            {isDelayed && etaChanged && (
              <span className="eta-changed">
                {' '}
                (updated from {formatDate(shipment.originalEstimatedDelivery)})
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt>Current location</dt>
          <dd>{shipment.currentLocation}</dd>
        </div>
        {Object.entries(shipment.details).map(([key, value]) => (
          <div key={key}>
            <dt>{formatKey(key)}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <h2>Tracking history</h2>
      {shipment.events.length === 0 ? (
        <p className="hint">No tracking events yet.</p>
      ) : (
        <ol className="timeline">
          {[...shipment.events].reverse().map((event, i) => (
            <li key={i} className={i === 0 ? 'timeline-latest' : ''}>
              <div className="timeline-date">
                {formatDateTime(event.occurredAt)}
              </div>
              <div className="timeline-status">
                {STATUS_LABELS[event.status] ?? event.status}
              </div>
              <div className="timeline-location">{event.location}</div>
              <div className="timeline-message">{event.message}</div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatKey(key: string) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
}
