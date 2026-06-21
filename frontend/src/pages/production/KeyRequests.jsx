import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getKeyRequests, decryptBatch, downloadFile } from '../../services/productionApi';
import Loader from '../../components/admin/Loader';

function KeyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

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
    setActionId(encryptedFileId);
    try {
      const res = await decryptBatch(encryptedFileId);
      toast.success(res.data.message);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Decryption failed.');
    } finally {
      setActionId(null);
    }
  };

  const handleDownload = async (encryptedFileId) => {
    setActionId(encryptedFileId);
    try {
      const res = await downloadFile(encryptedFileId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `batch_${encryptedFileId}.txt`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Download started.');
    } catch (err) {
      toast.error('Download failed.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div>
      <h2 className="mb-4">Key Requests</h2>

      {loading ? (
        <Loader />
      ) : requests.length === 0 ? (
        <p className="text-muted">No key requests yet.</p>
      ) : (
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
                <td><span className={`badge bg-${r.status === 'APPROVED' ? 'success' : r.status === 'REJECTED' ? 'danger' : 'warning'}`}>{r.status}</span></td>
                <td className="text-muted small">{new Date(r.requested_at).toLocaleString()}</td>
                <td className="text-muted small">{r.approved_at ? new Date(r.approved_at).toLocaleString() : '-'}</td>
                <td>
                  {r.status === 'APPROVED' && (
                    <div className="d-flex gap-1">
                      <button className="btn btn-sm btn-warning" disabled={actionId === r.encrypted_file} onClick={() => handleDecrypt(r.encrypted_file)}>
                        Decrypt
                      </button>
                      <button className="btn btn-sm btn-success" disabled={actionId === r.encrypted_file} onClick={() => handleDownload(r.encrypted_file)}>
                        Download
                      </button>
                    </div>
                  )}
                  {r.status === 'APPROVED' && (
                    <div className="small text-muted mt-1">Key shared automatically by the system.</div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default KeyRequests;