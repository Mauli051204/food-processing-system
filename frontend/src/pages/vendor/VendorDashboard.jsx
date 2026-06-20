import React, { useEffect, useState } from 'react';
import { Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  LineElement, PointElement, CategoryScale, LinearScale,
} from 'chart.js';
import { getVendorDashboard, getUploadTrend, getMaterialStatus, getUploadHistory } from '../../services/vendorApi';
import { getLatestNotifications } from '../../services/notificationApi';
import Loader from '../../components/admin/Loader';
import ErrorState from '../../components/admin/ErrorState';

ChartJS.register(ArcElement, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale);

function VendorDashboard() {
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [statusBreakdown, setStatusBreakdown] = useState([]);
  const [recentUploads, setRecentUploads] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchAll = () => {
    setLoading(true);
    setError(false);
    Promise.all([
      getVendorDashboard(),
      getUploadTrend(14),
      getMaterialStatus(),
      getUploadHistory(),
      getLatestNotifications(),
    ])
      .then(([d, t, s, h, n]) => {
        setStats(d.data.data);
        setTrend(t.data.data);
        setStatusBreakdown(s.data.data);
        setRecentUploads(h.data.data.slice(0, 5));
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
    { label: 'Total Uploads', value: stats.total_uploads, color: 'primary' },
    { label: 'Pending', value: stats.pending_uploads, color: 'warning' },
    { label: 'Sent to Purchase', value: stats.sent_to_purchase, color: 'info' },
    { label: 'Rejected', value: stats.rejected_uploads, color: 'danger' },
  ];

  const pieData = {
    labels: statusBreakdown.map((s) => s.label),
    datasets: [{
      data: statusBreakdown.map((s) => s.value),
      backgroundColor: ['#ffc107', '#0dcaf0', '#dc3545'],
    }],
  };

  const lineData = {
    labels: trend.map((t) => t.date.slice(5)),
    datasets: [{
      label: 'Uploads',
      data: trend.map((t) => t.count),
      borderColor: '#0d6efd',
      backgroundColor: 'rgba(13,110,253,0.15)',
      tension: 0.3,
      fill: true,
    }],
  };

  return (
    <div>
      <h2 className="mb-4">Vendor Dashboard</h2>

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

      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Material Status</h5>
              <Pie data={pieData} />
            </div>
          </div>
        </div>
        <div className="col-md-8">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Upload Trend (14 days)</h5>
              <Line data={lineData} />
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Recent Uploads</h5>
              {recentUploads.length === 0 ? (
                <p className="text-muted">No uploads yet.</p>
              ) : (
                <table className="table table-sm">
                  <tbody>
                    {recentUploads.map((u, i) => (
                      <tr key={i}>
                        <td>{u.file_name}</td>
                        <td className="text-muted small">{new Date(u.uploaded_at).toLocaleDateString()}</td>
                        <td><span className="badge bg-secondary">{u.status}</span></td>
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

export default VendorDashboard;