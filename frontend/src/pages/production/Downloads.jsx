import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getKeyRequests, downloadFile } from '../../services/productionApi';
import Loader from '../../components/admin/Loader';

function Downloads() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchData = () => {
    setLoading(true);
    getKeyRequests()
      .then((res) => setRequests(res.data.data.filter((r) => r.status === 'APPROVED')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDownload = async (encryptedFileId) => {
    setDownloadingId(encryptedFileId);
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
      toast.error(err.response?.data?.message || 'Download failed.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div>
      <h2 className="mb-4">Downloads</h2>
      <p className="text-muted small">Files with an approved key request, ready to decrypt and download.</p>

      {loading ? (
        <Loader />
      ) : requests.length === 0 ? (
        <p className="text-muted">No files available for download.</p>
      ) : (
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Material</th>
              <th>Vendor</th>
              <th>Approved Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <td>{r.material_name}</td>
                <td>{r.vendor_name}</td>
                <td className="text-muted small">{new Date(r.approved_at).toLocaleString()}</td>
                <td><span className="badge bg-success">Ready</span></td>
                <td>
                  <button className="btn btn-sm btn-success" disabled={downloadingId === r.encrypted_file} onClick={() => handleDownload(r.encrypted_file)}>
                    {downloadingId === r.encrypted_file ? 'Downloading...' : 'Download'}
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

export default Downloads;