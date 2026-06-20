import React, { useEffect, useState } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  BarElement, CategoryScale, LinearScale,
} from 'chart.js';
import { getPurchaseDashboard, getMaterialApprovalBreakdown, getReviewActivityTrend } from '../../services/purchaseApi';
import Loader from '../../components/admin/Loader';

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

function PurchaseStatistics() {
  const [stats, setStats] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getPurchaseDashboard(), getMaterialApprovalBreakdown(), getReviewActivityTrend(30)])
      .then(([d, b, a]) => {
        setStats(d.data.stats);
        setBreakdown(b.data.data);
        setActivity(a.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (!stats) return null;

  const cards = [
    { label: 'Pending Vendor Requests', value: stats.pending_vendor_requests, color: 'warning' },
    { label: 'Approved Materials', value: stats.approved_materials, color: 'success' },
    { label: 'Rejected Materials', value: stats.rejected_materials, color: 'danger' },
    { label: 'Sent to Tech', value: stats.sent_to_tech, color: 'primary' },
  ];

  const pieData = {
    labels: breakdown.map((b) => b.label),
    datasets: [{ data: breakdown.map((b) => b.value), backgroundColor: ['#0dcaf0', '#198754', '#dc3545'] }],
  };

  const barData = {
    labels: activity.map((a) => a.date.slice(5)),
    datasets: [
      { label: 'Approved', data: activity.map((a) => a.approved), backgroundColor: '#198754' },
      { label: 'Rejected', data: activity.map((a) => a.rejected), backgroundColor: '#dc3545' },
    ],
  };

  return (
    <div>
      <h2 className="mb-4">Statistics</h2>

      <div className="row g-3 mb-4">
        {cards.map((c) => (
          <div className="col-md-3 col-sm-6" key={c.label}>
            <div className={`card border-${c.color} h-100`}>
              <div className="card-body">
                <h6 className="card-subtitle text-muted small">{c.label}</h6>
                <h3 className={`text-${c.color}`}>{c.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row">
        <div className="col-md-5">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Material Approval Distribution</h5>
              <Pie data={pieData} />
            </div>
          </div>
        </div>
        <div className="col-md-7">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Review Activity (30 days)</h5>
              <Bar data={barData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PurchaseStatistics;