import { useEffect, useState } from 'react';

type Enquiry = {
  id: string;
  trackingNumber: string;
  category: string;
  message: string;
  state: 'OPEN' | 'RESOLVED';
  createdAt: string;
};

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/staff/enquiries');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEnquiries(data.enquiries);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleState(enquiry: Enquiry) {
    const newState = enquiry.state === 'OPEN' ? 'RESOLVED' : 'OPEN';
    await fetch(`/api/staff/enquiries/${enquiry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: newState }),
    });
    load();
  }

  if (loading) return <p className="hint">Loading enquiries…</p>;
  if (error)
    return (
      <p className="error-message" role="alert">
        Couldn't load enquiries.
      </p>
    );
  if (enquiries.length === 0) return <p className="hint">No enquiries yet.</p>;

  return (
    <div>
      <h1>Enquiries</h1>
      <ul className="enquiry-list">
        {enquiries.map((eq) => (
          <li key={eq.id} className="panel">
            <div className="enquiry-top">
              <span className="shipment-card-tracking">
                {eq.trackingNumber}
              </span>
              <span
                className={`status-pill ${eq.state === 'OPEN' ? 'status-delayed' : 'status-delivered'}`}
              >
                {eq.state === 'OPEN' ? 'Open' : 'Resolved'}
              </span>
            </div>
            <div className="hint">
              {eq.category} · {new Date(eq.createdAt).toLocaleString('en-GB')}
            </div>
            <p>{eq.message}</p>
            <button onClick={() => toggleState(eq)}>
              Mark as {eq.state === 'OPEN' ? 'resolved' : 'open'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
