import React, { useEffect, useState } from 'react';
import { Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  LineElement, PointElement, CategoryScale, LinearScale,
} from 'chart.js';
import { getProductionDashboard, getDownloadTrend, getKeyRequestStatusBreakdown, getKeyRequests, getDownloadHistory } from '../../services/productionApi';
import { getLatestNotifications } from '../../services/notificationApi';
import Loader from '../../components/admin/Loader';
import ErrorState from '../../components/admin/ErrorState';

ChartJS.register(ArcElement, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale);

function ProductionDashboard() {
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [recentDownloads, setRecentDownloads] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchAll = () => {
    setLoading(true);
    setError(false);
    Promise.all([
      getProductionDashboard(),
      getDownloadTrend(14),
      getKeyRequestStatusBreakdown(),
      getKeyRequests(),
      getDownloadHistory({ page_size: 5 }),
      getLatestNotifications(),
    ])
      .then(([d, t, b, kr, dh, n]) => {
        setStats(d.data.stats);
        setTrend(t.data.data);
        setBreakdown(b.data.data);
        setRecentRequests(kr.data.data.slice(0, 5));
        setRecentDownloads(dh.data.data);
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
    { label: 'Available Encrypted Files', value: stats.available_batches, color: 'info' },
    { label: 'Pending Key Requests', value: stats.pending_key_requests, color: 'warning' },
    { label: 'Approved Key Requests', value: stats.approved_key_requests, color: 'success' },
    { label: 'Total Downloads', value: stats.downloads, color: 'primary' },
    { label: 'Decrypted Files', value: stats.decrypted_files, color: 'secondary' },
  ];

  const pieData = {
    labels: breakdown.map((b) => b.label),
    datasets: [{ data: breakdown.map((b) => b.value), backgroundColor: ['#ffc107', '#198754', '#dc3545'] }],
  };

  const lineData = {
    labels: trend.map((t) => t.date.slice(5)),
    datasets: [{ label: 'Downloads', data: trend.map((t) => t.count), borderColor: '#0d6efd', backgroundColor: 'rgba(13,110,253,0.15)', tension: 0.3, fill: true }],
  };

  return (
    <div>
      <h2 className="mb-4">Production Dashboard</h2>

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

      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Key Request Status</h5>
              <Pie data={pieData} />
            </div>
          </div>
        </div>
        <div className="col-md-8">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Download Trend (14 days)</h5>
              <Line data={lineData} />
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Recent Key Requests</h5>
              {recentRequests.length === 0 ? (
                <p className="text-muted">No key requests yet.</p>
              ) : (
                recentRequests.map((r) => (
                  <div key={r.id} className="border-bottom py-2">
                    <div className="small fw-bold">{r.material_name}</div>
                    <span className={`badge bg-${r.status === 'APPROVED' ? 'success' : r.status === 'REJECTED' ? 'danger' : 'warning'}`}>{r.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Recent Downloads</h5>
              {recentDownloads.length === 0 ? (
                <p className="text-muted">No downloads yet.</p>
              ) : (
                recentDownloads.map((d) => (
                  <div key={d.id} className="border-bottom py-2">
                    <div className="small fw-bold">{d.material_name}</div>
                    <div className="small text-muted">{d.downloaded_file_path}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <div className="col-md-4">
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

export default ProductionDashboard;