import React, { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { getAdminDashboard } from '../../services/adminApi';
import DashboardCard from '../../components/admin/DashboardCard';
import Loader from '../../components/admin/Loader';
import ErrorState from '../../components/admin/ErrorState';

ChartJS.register(ArcElement, Tooltip, Legend);

function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = () => {
    setLoading(true);
    setError(false);
    getAdminDashboard()
      .then((res) => setData(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <Loader />;
  if (error) return <ErrorState onRetry={fetchData} />;
  if (!data) return null;

  const { stats, recent_activity } = data;

  const cards = [
    { label: 'Total Users', value: stats.total_users, color: 'primary' },
    { label: 'Vendors', value: stats.total_vendors, color: 'info' },
    { label: 'Purchase Team', value: stats.total_purchase_team, color: 'info' },
    { label: 'Tech Team', value: stats.total_tech_team, color: 'info' },
    { label: 'Production Team', value: stats.total_production_team, color: 'info' },
    { label: 'Pending Users', value: stats.pending_user_approvals, color: 'warning' },
    { label: 'Pending Key Requests', value: stats.pending_key_requests, color: 'warning' },
    { label: 'Uploaded Files', value: stats.total_uploaded_files, color: 'secondary' },
    { label: 'Approved Materials', value: stats.total_approved_materials, color: 'success' },
    { label: 'Rejected Materials', value: stats.total_rejected_materials, color: 'danger' },
    { label: 'Encrypted Files', value: stats.total_encrypted_files, color: 'dark' },
    { label: 'Downloads', value: stats.total_downloads, color: 'primary' },
  ];

  const pieData = {
    labels: ['Vendors', 'Purchase', 'Tech', 'Production'],
    datasets: [
      {
        data: [stats.total_vendors, stats.total_purchase_team, stats.total_tech_team, stats.total_production_team],
        backgroundColor: ['#0d6efd', '#6610f2', '#fd7e14', '#198754'],
      },
    ],
  };

  return (
    <div>
      <h2 className="mb-4">Admin Dashboard</h2>
      <div className="row">
        {cards.map((c) => (
          <DashboardCard key={c.label} {...c} />
        ))}
      </div>

      <div className="row mt-4">
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">User Distribution</h5>
              <Pie data={pieData} />
            </div>
          </div>
        </div>

        <div className="col-md-8">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Recent Audit Logs</h5>
              <table className="table table-sm">
                <tbody>
                  {recent_activity.latest_audit_logs.map((log) => (
                    <tr key={log.id}>
                      <td>{log.action}</td>
                      <td className="text-muted small">{log.description}</td>
                      <td className="text-muted small">{new Date(log.date).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;