import React, { useEffect, useState } from 'react';
import { getUploadHistory } from '../../services/vendorApi';
import Loader from '../../components/admin/Loader';

function UploadHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUploadHistory()
      .then((res) => setHistory(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div>
      <h2 className="mb-4">Upload History</h2>
      {history.length === 0 ? (
        <p className="text-muted">No uploads yet.</p>
      ) : (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>File Name</th>
              <th>Uploaded At</th>
              <th>Imported</th>
              <th>Rejected</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h, i) => (
              <tr key={i}>
                <td>{h.file_name}</td>
                <td>{new Date(h.uploaded_at).toLocaleString()}</td>
                <td className="text-success">{h.rows_imported}</td>
                <td className="text-danger">{h.rows_rejected}</td>
                <td><span className="badge bg-secondary">{h.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default UploadHistory;