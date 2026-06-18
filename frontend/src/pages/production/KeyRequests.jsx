import React, { useEffect, useState } from 'react';
import { getKeyRequests, decryptBatch, downloadFile } from '../../api/productionApi';

function KeyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchRequests = () => {
    setLoading(true);
    getKeyRequests()
      .then((res) => setRequests(res.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleDecrypt = async (encryptedFileId) => {
    try {
      const res = await decryptBatch(encryptedFileId);
      setMessage(res.data.message);
      fetchRequests();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Decryption failed.');
    }
  };

  const handleDownload = async (encryptedFileId) => {
    try {
      const res = await downloadFile(encryptedFileId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `batch_${encryptedFileId}.txt`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setMessage('Download failed.');
    }
  };

  if (loading) return <div className="container mt-5">Loading...</div>;

  return (
    <div className="container mt-5">
      <h2 className="mb-4">My Key Requests</h2>
      {message && <div className="alert alert-info">{message}</div>}

      <table className="table table-striped">
        <thead>
          <tr>
            <th>Material</th>
            <th>Vendor</th>
            <th>Status</th>
            <th>Requested</th>
            <th>Approved</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r.id}>
              <td>{r.material_name}</td>
              <td>{r.vendor_name}</td>
              <td>{r.status}</td>
              <td>{new Date(r.requested_at).toLocaleString()}</td>
              <td>{r.approved_at ? new Date(r.approved_at).toLocaleString() : '-'}</td>
              <td>
                {r.status === 'APPROVED' && (
                  <>
                    <button className="btn btn-sm btn-warning me-2" onClick={() => handleDecrypt(r.encrypted_file)}>
                      Decrypt
                    </button>
                    <button className="btn btn-sm btn-success" onClick={() => handleDownload(r.encrypted_file)}>
                      Download
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default KeyRequests;