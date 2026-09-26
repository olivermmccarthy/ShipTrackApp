import { useState } from 'react';
import TruckLoader from '../components/TruckLoader';
import StageTracker from '../components/StageTracker';

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

// Tracking numbers are letters, digits and dashes only, 4-30 chars.
// Deliberately not requiring a "TRK-" prefix specifically, since staff
// can supply their own custom tracking number on creation.
const TRACKING_NUMBER_CHARS_PATTERN = /^[A-Za-z0-9-]+$/;
const MIN_TRACKING_NUMBER_LENGTH = 4;
const MAX_TRACKING_NUMBER_LENGTH = 30;

// Minimum time the loading state stays visible, even if the real request
// is faster. Makes the loading state actually demonstrable, and leaves
// room to swap the placeholder truck below for a real animation later.
const MIN_SEARCH_DELAY_MS = 1200;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
    if (
      trimmed.length < MIN_TRACKING_NUMBER_LENGTH ||
      trimmed.length > MAX_TRACKING_NUMBER_LENGTH
    ) {
      setError(
        `Tracking numbers are between ${MIN_TRACKING_NUMBER_LENGTH} and ${MAX_TRACKING_NUMBER_LENGTH} characters. Please check and try again.`,
      );
      return;
    }
    if (!TRACKING_NUMBER_CHARS_PATTERN.test(trimmed)) {
      setError(
        "That doesn't look like a valid tracking number. Please only use letters, numbers and dashes.",
      );
      return;
    }

    setLoading(true);
    setError(null);
    setShipment(null);
    setSearched(true);

    try {
      const [res] = await Promise.all([
        fetch(`/api/shipments/${encodeURIComponent(trimmed)}`),
        delay(MIN_SEARCH_DELAY_MS),
      ]);
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
    <div className="tracking-page-bg">
      <div className="tracking-page">
        <h1>Track your shipment</h1>
        <form onSubmit={handleSearch} className="tracking-form">
          <label htmlFor="trackingNumber">Tracking number</label>
          <div className="tracking-form-row">
            <div className="search-input-wrap">
              <input
                id="trackingNumber"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. TRK-DEMO-001"
              />
              {input && (
                <button
                  type="button"
                  className="clear-btn"
                  aria-label="Clear tracking number"
                  onClick={() => setInput('')}
                >
                  ×
                </button>
              )}
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Searching…' : 'Track'}
            </button>
          </div>
        </form>

        {loading && <TruckLoader />}

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

      <StageTracker status={shipment.status} events={shipment.events} />

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
      <EnquiryForm trackingNumber={shipment.trackingNumber} />
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

function EnquiryForm({ trackingNumber }: { trackingNumber: string }) {
  const [category, setCategory] = useState('General Question');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus('submitting');
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumber, category, message }),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
      setMessage('');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <p className="enquiry-success" role="status">
        Thanks, your enquiry has been submitted. Our team will get back to you.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="enquiry-form">
      <h2>Have a question about this shipment?</h2>

      <label htmlFor="category">Category</label>
      <select
        id="category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        <option>General Question</option>
        <option>Delivery Time</option>
        <option>Delay</option>
        <option>Address Issue</option>
        <option>Damaged Item</option>
      </select>

      <label htmlFor="message">Message</label>
      <textarea
        id="message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        required
      />

      {status === 'error' && (
        <p className="error-message" role="alert">
          Something went wrong submitting your enquiry. Please try again.
        </p>
      )}

      <button type="submit" disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Submitting…' : 'Submit enquiry'}
      </button>
    </form>
  );
}
