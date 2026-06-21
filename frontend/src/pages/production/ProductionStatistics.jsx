import React, { useEffect, useState } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  BarElement, CategoryScale, LinearScale,
} from 'chart.js';
import { getProductionStatistics, getKeyRequestStatusBreakdown, getDownloadTrend } from '../../services/productionApi';
import Loader from '../../components/admin/Loader';

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

function ProductionStatistics() {
  const [stats, setStats] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getProductionStatistics(), getKeyRequestStatusBreakdown(), getDownloadTrend(30)])
      .then(([s, b, t]) => {
        setStats(s.data.data);
        setBreakdown(b.data.data);
        setTrend(t.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (!stats) return null;

  const cards = [
    { label: 'Total Downloads', value: stats.total_downloads, color: 'primary' },
    { label: "Today's Downloads", value: stats.todays_downloads, color: 'info' },
    { label: 'Pending Requests', value: stats.pending_requests, color: 'warning' },
    { label: 'Approved Requests', value: stats.approved_requests, color: 'success' },
    { label: 'Rejected Requests', value: stats.rejected_requests, color: 'danger' },
  ];

  const pieData = {
    labels: breakdown.map((b) => b.label),
    datasets: [{ data: breakdown.map((b) => b.value), backgroundColor: ['#ffc107', '#198754', '#dc3545'] }],
  };

  const barData = {
    labels: trend.map((t) => t.date.slice(5)),
    datasets: [{ label: 'Downloads', data: trend.map((t) => t.count), backgroundColor: '#0d6efd' }],
  };

  return (
    <div>
      <h2 className="mb-4">Statistics</h2>

      <div className="row g-3 mb-4">
        {cards.map((c) => (
          <div className="col-md-2-4 col-sm-4" key={c.label} style={{ flex: '1 0 19%' }}>
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
              <h5 className="card-title">Key Request Distribution</h5>
              <Pie data={pieData} />
            </div>
          </div>
        </div>
        <div className="col-md-7">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Monthly Downloads (30 days)</h5>
              <Bar data={barData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductionStatistics;