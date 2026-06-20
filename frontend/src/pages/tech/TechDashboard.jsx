import React, { useEffect, useState } from 'react';
import { Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  LineElement, PointElement, CategoryScale, LinearScale,
} from 'chart.js';
import { getTechDashboard, getEncryptionTrend, getEncryptionStatusBreakdown } from '../../services/techApi';
import { getLatestNotifications } from '../../services/notificationApi';
import Loader from '../../components/admin/Loader';
import ErrorState from '../../components/admin/ErrorState';

ChartJS.register(ArcElement, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale);

function TechDashboard() {
  const [stats, setStats] = useState(null);
  const [recentEncryptions, setRecentEncryptions] = useState([]);
  const [trend, setTrend] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchAll = () => {
    setLoading(true);
    setError(false);
    Promise.all([
      getTechDashboard(),
      getEncryptionTrend(14),
      getEncryptionStatusBreakdown(),
      getLatestNotifications(),
    ])
      .then(([d, t, b, n]) => {
        setStats(d.data.stats);
        setRecentEncryptions(d.data.recent_encryptions);
        setTrend(t.data.data);
        setBreakdown(b.data.data);
        setRecentNotifications(n.data.data);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  if (loading) return <Loader />;
  if (error) return <ErrorState onRetry={fetchAll} />;
  if (!stats) return null;

  const cards = [
    { label: 'Materials Received', value: stats.materials_received, color: 'info' },
    { label: 'TXT Files Generated', value: stats.txt_files_generated, color: 'secondary' },
    { label: 'Files Encrypted', value: stats.files_encrypted, color: 'success' },
    { label: 'Pending Admin Approval', value: stats.pending_admin_approval, color: 'warning' },
    { label: 'Completed', value: stats.completed_encryptions, color: 'primary' },
  ];

  const pieData = {
    labels: breakdown.map((b) => b.label),
    datasets: [{ data: breakdown.map((b) => b.value), backgroundColor: ['#0dcaf0', '#198754', '#ffc107', '#6610f2', '#212529'] }],
  };

  const lineData = {
    labels: trend.map((t) => t.date.slice(5)),
    datasets: [
      { label: 'TXT Generated', data: trend.map((t) => t.generated), borderColor: '#0dcaf0', backgroundColor: 'rgba(13,202,240,0.15)', tension: 0.3 },
      { label: 'Encrypted', data: trend.map((t) => t.encrypted), borderColor: '#198754', backgroundColor: 'rgba(25,135,84,0.15)', tension: 0.3 },
    ],
  };

  return (
    <div>
      <h2 className="mb-4">Tech Dashboard</h2>

      <div className="row g-3 mb-4">
        {cards.map((c) => (
          <div className="col-md-2 col-sm-4" key={c.label}>
            <div className={`card border-${c.color} h-100`}>
              <div className="card-body">
                <h6 className="card-subtitle text-muted small">{c.label}</h6>
                <h3 className={`text-${c.color}`}>{c.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Encryption Status Breakdown</h5>
              <Pie data={pieData} />
            </div>
          </div>
        </div>
        <div className="col-md-8">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Daily Encryption Trend (14 days)</h5>
              <Line data={lineData} />
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Recent Encryptions</h5>
              {recentEncryptions.length === 0 ? (
                <p className="text-muted">No encryptions yet.</p>
              ) : (
                <table className="table table-sm">
                  <tbody>
                    {recentEncryptions.map((e) => (
                      <tr key={e.id}>
                        <td>{e.material_name}</td>
                        <td className="text-muted small">{e.vendor_name}</td>
                        <td><span className="badge bg-secondary">{e.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Latest Notifications</h5>
              {recentNotifications.length === 0 ? (
                <p className="text-muted">No notifications yet.</p>
              ) : (
                recentNotifications.map((n) => (
                  <div key={n.id} className="border-bottom py-2">
                    <div className="small fw-bold">{n.title}</div>
                    <div className="small text-muted">{n.message}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TechDashboard;