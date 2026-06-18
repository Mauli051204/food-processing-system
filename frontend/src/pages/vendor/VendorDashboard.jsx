import React, { useEffect, useState } from 'react';
import { getVendorDashboard } from '../../api/vendorApi';

function VendorDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getVendorDashboard()
      .then((res) => setStats(res.data.data))
      .catch(() => setError('Failed to load dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container mt-5">Loading...</div>;
  if (error) return <div className="container mt-5 alert alert-danger">{error}</div>;

  const cards = [
    { label: 'Total Uploads', value: stats.total_uploads, color: 'primary' },
    { label: 'Pending Uploads', value: stats.pending_uploads, color: 'warning' },
    { label: 'Sent to Purchase', value: stats.sent_to_purchase, color: 'success' },
    { label: 'Rejected Uploads', value: stats.rejected_uploads, color: 'danger' },
  ];

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Vendor Dashboard</h2>
      <div className="row g-3">
        {cards.map((card) => (
          <div className="col-md-3" key={card.label}>
            <div className={`card border-${card.color}`}>
              <div className="card-body">
                <h6 className="card-subtitle text-muted">{card.label}</h6>
                <h3 className={`text-${card.color}`}>{card.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default VendorDashboard;