import React, { useEffect, useState } from 'react';
import { getPurchaseDashboard } from '../../api/purchaseApi';

function PurchaseDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPurchaseDashboard()
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container mt-5">Loading...</div>;
  if (!data) return <div className="container mt-5 alert alert-danger">Failed to load dashboard.</div>;

  const cards = [
    { label: 'Pending Vendor Requests', value: data.stats.pending_vendor_requests, color: 'info' },
    { label: 'Pending Materials', value: data.stats.pending_materials, color: 'warning' },
    { label: 'Approved Materials', value: data.stats.approved_materials, color: 'success' },
    { label: 'Rejected Materials', value: data.stats.rejected_materials, color: 'danger' },
    { label: 'Sent To Tech', value: data.stats.sent_to_tech, color: 'primary' },
  ];

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Purchase Dashboard</h2>
      <div className="row g-3 mb-4">
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

      <h4>Recent Requests</h4>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Vendor</th>
            <th>Company</th>
            <th>Upload Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.recent_requests.map((r) => (
            <tr key={r.id}>
              <td>{r.vendor_name}</td>
              <td>{r.company}</td>
              <td>{new Date(r.upload_date).toLocaleString()}</td>
              <td><span className="badge bg-secondary">{r.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PurchaseDashboard;