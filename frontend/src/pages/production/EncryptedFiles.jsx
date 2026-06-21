import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getAvailableEncryptedFiles, requestKey } from '../../services/productionApi';
import Loader from '../../components/admin/Loader';

function EncryptedFiles() {
  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState(null);

  const fetchFiles = () => {
    setLoading(true);
    getAvailableEncryptedFiles({ search })
      .then((res) => setFiles(res.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleRequestKey = async (id) => {
    setRequestingId(id);
    try {
      const res = await requestKey(id);
      toast.success(res.data.message);
      fetchFiles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request key.');
    } finally {
      setRequestingId(null);
    }
  };

  return (
    <div>
      <h2 className="mb-4">Encrypted Files</h2>

      <form onSubmit={(e) => { e.preventDefault(); fetchFiles(); }} className="mb-3 d-flex gap-2" style={{ maxWidth: '400px' }}>
        <input type="text" className="form-control" placeholder="Search by vendor" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button type="submit" className="btn btn-outline-primary">Search</button>
      </form>

      {loading ? (
        <Loader />
      ) : files.length === 0 ? (
        <p className="text-muted">No encrypted files available for key request.</p>
      ) : (
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Material</th>
              <th>Vendor</th>
              <th>Encryption Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {files.map((f) => (
              <tr key={f.id}>
                <td>{f.material_name}</td>
                <td>{f.vendor_name}</td>
                <td className="text-muted small">{new Date(f.created_at).toLocaleString()}</td>
                <td><span className="badge bg-success">{f.status}</span></td>
                <td>
                  <button
                    className="btn btn-sm btn-primary"
                    disabled={requestingId === f.id}
                    onClick={() => handleRequestKey(f.id)}
                  >
                    {requestingId === f.id ? 'Requesting...' : 'Request Key'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default EncryptedFiles;