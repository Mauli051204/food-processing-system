import React, { useEffect, useState } from 'react';
import { getProductionHistory } from '../../api/productionApi';

function BatchDetails() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProductionHistory()
      .then((res) => setHistory(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container mt-5">Loading...</div>;

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Production History</h2>
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Batch</th>
            <th>Vendor</th>
            <th>Request Date</th>
            <th>Approval Date</th>
            <th>Download Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {history.map((h) => (
            <tr key={h.batch_id}>
              <td>#{h.batch_id}</td>
              <td>{h.vendor_name}</td>
              <td>{new Date(h.request_date).toLocaleString()}</td>
              <td>{h.approval_date ? new Date(h.approval_date).toLocaleString() : '-'}</td>
              <td>{h.download_date ? new Date(h.download_date).toLocaleString() : '-'}</td>
              <td>{h.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default BatchDetails;