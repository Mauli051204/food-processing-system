import React, { useEffect, useState } from 'react';
import { getAvailableEncryptedFiles, requestKey } from '../../api/productionApi';

function EncryptedFiles() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchFiles = () => {
    setLoading(true);
    getAvailableEncryptedFiles()
      .then((res) => setFiles(res.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleRequestKey = async (id) => {
    try {
      const res = await requestKey(id);
      setMessage(res.data.message);
      fetchFiles();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to request key.');
    }
  };

  if (loading) return <div className="container mt-5">Loading...</div>;

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Available Encrypted Files</h2>
      {message && <div className="alert alert-info">{message}</div>}

      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Material</th>
            <th>Vendor</th>
            <th>Purchase Date</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {files.map((f) => (
            <tr key={f.id}>
              <td>{f.material_name}</td>
              <td>{f.vendor_name}</td>
              <td>{new Date(f.purchase_date).toLocaleString()}</td>
              <td>{f.status}</td>
              <td>
                <button className="btn btn-sm btn-primary" onClick={() => handleRequestKey(f.id)}>
                  Request Key
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default EncryptedFiles;