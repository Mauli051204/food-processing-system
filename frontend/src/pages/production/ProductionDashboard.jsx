import React, { useEffect, useState } from 'react';
import { getProductionDashboard } from '../../api/productionApi';

function ProductionDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProductionDashboard()
      .then((res) => setStats(res.data.stats))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container mt-5">Loading...</div>;
  if (!stats) return <div className="container mt-5 alert alert-danger">Failed to load dashboard.</div>;

  const cards = [
    { label: 'Available Encrypted Batches', value: stats.available_batches, color: 'info' },
    { label: 'Pending Key Requests', value: stats.pending_key_requests, color: 'warning' },
    { label: 'Approved Key Requests', value: stats.approved_key_requests, color: 'success' },
    { label: 'Decrypted Files', value: stats.decrypted_files, color: 'primary' },
    { label: 'Downloads', value: stats.downloads, color: 'secondary' },
  ];

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Production Dashboard</h2>
      <div className="row g-3">
        {cards.map((card) => (
          <div className="col-md-2 col-sm-4" key={card.label}>
            <div className={`card border-${card.color}`}>
              <div className="card-body">
                <h6 className="card-subtitle text-muted small">{card.label}</h6>
                <h3 className={`text-${card.color}`}>{card.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductionDashboard;