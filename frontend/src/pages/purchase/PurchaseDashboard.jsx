import React, { useEffect, useState } from 'react';
import { Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  LineElement, PointElement, CategoryScale, LinearScale,
} from 'chart.js';
import { getPurchaseDashboard, getVendorApprovalTrend, getMaterialApprovalBreakdown } from '../../services/purchaseApi';
import { getLatestNotifications } from '../../services/notificationApi';
import Loader from '../../components/admin/Loader';
import ErrorState from '../../components/admin/ErrorState';

ChartJS.register(ArcElement, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale);

function PurchaseDashboard() {
  const [stats, setStats] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [trend, setTrend] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchAll = () => {
    setLoading(true);
    setError(false);
    Promise.all([
      getPurchaseDashboard(),
      getVendorApprovalTrend(14),
      getMaterialApprovalBreakdown(),
      getLatestNotifications(),
    ])
      .then(([d, t, b, n]) => {
        setStats(d.data.stats);
        setRecentRequests(d.data.recent_requests);
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
    { label: 'Pending Vendor Requests', value: stats.pending_vendor_requests, color: 'warning' },
    { label: 'Pending Materials', value: stats.pending_materials, color: 'info' },
    { label: 'Approved Materials', value: stats.approved_materials, color: 'success' },
    { label: 'Rejected Materials', value: stats.rejected_materials, color: 'danger' },
    { label: 'Sent to Tech', value: stats.sent_to_tech, color: 'primary' },
  ];

  const pieData = {
    labels: breakdown.map((b) => b.label),
    datasets: [{ data: breakdown.map((b) => b.value), backgroundColor: ['#0dcaf0', '#198754', '#dc3545'] }],
  };

  const lineData = {
    labels: trend.map((t) => t.date.slice(5)),
    datasets: [
      { label: 'Approved', data: trend.map((t) => t.approved), borderColor: '#198754', backgroundColor: 'rgba(25,135,84,0.15)', tension: 0.3 },
      { label: 'Rejected', data: trend.map((t) => t.rejected), borderColor: '#dc3545', backgroundColor: 'rgba(220,53,69,0.15)', tension: 0.3 },
      { label: 'Pending', data: trend.map((t) => t.pending), borderColor: '#ffc107', backgroundColor: 'rgba(255,193,7,0.15)', tension: 0.3 },
    ],
  };

  return (
    <div>
      <h2 className="mb-4">Purchase Dashboard</h2>

      <div className="row g-3 mb-4">
        {cards.map((c) => (
          <div className="col-md-2-4 col-md-4 col-sm-6" key={c.label} style={{ flex: '1 0 18%' }}>
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
              <h5 className="card-title">Material Approval Breakdown</h5>
              <Pie data={pieData} />
            </div>
          </div>
        </div>
        <div className="col-md-8">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Vendor Approval Trend (14 days)</h5>
              <Line data={lineData} />
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Recent Vendor Requests</h5>
              {recentRequests.length === 0 ? (
                <p className="text-muted">No recent requests.</p>
              ) : (
                <table className="table table-sm">
                  <tbody>
                    {recentRequests.map((r) => (
                      <tr key={r.id}>
                        <td>{r.vendor_name}</td>
                        <td className="text-muted small">{r.company}</td>
                        <td><span className="badge bg-secondary">{r.status}</span></td>
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

export default PurchaseDashboard;