import React, { useEffect, useState } from 'react';
import { getDownloadHistory } from '../../api/productionApi';

function DownloadHistory() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDownloadHistory()
      .then((res) => setRecords(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container mt-5">Loading...</div>;

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Download History</h2>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Material</th>
            <th>Vendor</th>
            <th>File</th>
            <th>Downloaded At</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id}>
              <td>{r.material_name}</td>
              <td>{r.vendor_name}</td>
              <td>{r.downloaded_file_path}</td>
              <td>{new Date(r.downloaded_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DownloadHistory;