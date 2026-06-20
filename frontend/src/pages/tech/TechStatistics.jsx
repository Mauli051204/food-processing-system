import React, { useEffect, useState } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  BarElement, CategoryScale, LinearScale,
} from 'chart.js';
import { getTechStatistics, getEncryptionStatusBreakdown, getEncryptionTrend } from '../../services/techApi';
import Loader from '../../components/admin/Loader';

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

function TechStatistics() {
  const [stats, setStats] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getTechStatistics(), getEncryptionStatusBreakdown(), getEncryptionTrend(30)])
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
    { label: 'Total Encryptions', value: stats.total_encryptions, color: 'primary' },
    { label: "Today's Encryptions", value: stats.todays_encryptions, color: 'info' },
    { label: 'Pending Files', value: stats.pending_files, color: 'warning' },
    { label: 'Completed Files', value: stats.completed_files, color: 'success' },
  ];

  const pieData = {
    labels: breakdown.map((b) => b.label),
    datasets: [{ data: breakdown.map((b) => b.value), backgroundColor: ['#0dcaf0', '#198754', '#ffc107', '#6610f2', '#212529'] }],
  };

  const barData = {
    labels: trend.map((t) => t.date.slice(5)),
    datasets: [
      { label: 'TXT Generated', data: trend.map((t) => t.generated), backgroundColor: '#0dcaf0' },
      { label: 'Encrypted', data: trend.map((t) => t.encrypted), backgroundColor: '#198754' },
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
              <h5 className="card-title">Status Distribution</h5>
              <Pie data={pieData} />
            </div>
          </div>
        </div>
        <div className="col-md-7">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Monthly Encryption Summary (30 days)</h5>
              <Bar data={barData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TechStatistics;