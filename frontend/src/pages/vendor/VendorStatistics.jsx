import React, { useEffect, useState } from 'react';
import { Pie, Line } from 'react-chartjs-2';
import { getMaterialStatus, getUploadTrend } from '../../services/vendorApi';
import Loader from '../../components/admin/Loader';

function VendorStatistics() {
  const [statusBreakdown, setStatusBreakdown] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMaterialStatus(), getUploadTrend(30)])
      .then(([s, t]) => {
        setStatusBreakdown(s.data.data);
        setTrend(t.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  const pieData = {
    labels: statusBreakdown.map((s) => s.label),
    datasets: [{ data: statusBreakdown.map((s) => s.value), backgroundColor: ['#ffc107', '#0dcaf0', '#dc3545'] }],
  };

  const lineData = {
    labels: trend.map((t) => t.date.slice(5)),
    datasets: [{ label: 'Uploads', data: trend.map((t) => t.count), borderColor: '#0d6efd', backgroundColor: 'rgba(13,110,253,0.15)', tension: 0.3, fill: true }],
  };

  return (
    <div>
      <h2 className="mb-4">Statistics</h2>
      <div className="row">
        <div className="col-md-5">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Material Status Breakdown</h5>
              <Pie data={pieData} />
            </div>
          </div>
        </div>
        <div className="col-md-7">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Upload Trend (30 days)</h5>
              <Line data={lineData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorStatistics;