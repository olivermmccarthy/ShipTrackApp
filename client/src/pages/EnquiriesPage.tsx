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
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');

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

  const filtered =
    filter === 'ALL'
      ? enquiries
      : enquiries.filter((eq) => eq.state === filter);

  return (
    <div>
      <h1>Enquiries</h1>

      <div className="filter-bar">
        <select
          value={filter}
          onChange={(e) =>
            setFilter(e.target.value as 'ALL' | 'OPEN' | 'RESOLVED')
          }
        >
          <option value="ALL">All enquiries</option>
          <option value="OPEN">Open</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>

      {enquiries.length === 0 && <p className="hint">No enquiries yet.</p>}
      {enquiries.length > 0 && filtered.length === 0 && (
        <p className="hint">No enquiries match this filter.</p>
      )}

      {filtered.length > 0 && (
        <ul className="enquiry-list">
          {filtered.map((eq) => (
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
      )}
    </div>
  );
}
