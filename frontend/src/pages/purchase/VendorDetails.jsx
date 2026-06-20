import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getVendorDetail } from '../../services/purchaseApi';
import Loader from '../../components/admin/Loader';
import ErrorState from '../../components/admin/ErrorState';

function VendorDetail() {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getVendorDetail(vendorId)
      .then((res) => setDetail(res.data.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [vendorId]);

  if (loading) return <Loader />;
  if (error || !detail) return <ErrorState message="Vendor not found." />;

  return (
    <div>
      <button className="btn btn-link ps-0 mb-3" onClick={() => navigate('/purchase/vendor-requests')}>&larr; Back to Vendor Requests</button>
      <h2 className="mb-4">{detail.full_name}</h2>

      <div className="row">
        <div className="col-md-5">
          <div className="card mb-3">
            <div className="card-body">
              <p><strong>Email:</strong> {detail.email}</p>
              <p><strong>Phone:</strong> {detail.phone || '-'}</p>
              <p><strong>Company:</strong> {detail.company_name}</p>
              <p><strong>Total Materials:</strong> {detail.total_materials}</p>
              <p><strong>Imported Rows:</strong> {detail.imported_rows}</p>
              <p><strong>Rejected Rows:</strong> {detail.rejected_rows}</p>
            </div>
          </div>
        </div>
        <div className="col-md-7">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Upload History</h5>
              {detail.upload_history.length === 0 ? (
                <p className="text-muted">No uploads yet.</p>
              ) : (
                <table className="table table-sm">
                  <thead><tr><th>File</th><th>Date</th><th>Imported</th><th>Rejected</th></tr></thead>
                  <tbody>
                    {detail.upload_history.map((h, i) => (
                      <tr key={i}>
                        <td>{h.file_name}</td>
                        <td className="text-muted small">{new Date(h.uploaded_at).toLocaleDateString()}</td>
                        <td className="text-success">{h.rows_imported}</td>
                        <td className="text-danger">{h.rows_rejected}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorDetail;