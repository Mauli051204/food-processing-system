import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getVendorDetail } from '../../api/purchaseApi';

function VendorDetails() {
  const { vendorId } = useParams();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVendorDetail(vendorId)
      .then((res) => setVendor(res.data.data))
      .finally(() => setLoading(false));
  }, [vendorId]);

  if (loading) return <div className="container mt-5">Loading...</div>;
  if (!vendor) return <div className="container mt-5 alert alert-danger">Vendor not found.</div>;

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Vendor Details</h2>

      <div className="card mb-4">
        <div className="card-body">
          <p><strong>Name:</strong> {vendor.full_name}</p>
          <p><strong>Email:</strong> {vendor.email}</p>
          <p><strong>Phone:</strong> {vendor.phone}</p>
          <p><strong>Company:</strong> {vendor.company_name}</p>
          <p><strong>Address:</strong> {vendor.address || 'N/A'}</p>
          <p><strong>Total Materials:</strong> {vendor.total_materials}</p>
          <p><strong>Imported Rows:</strong> {vendor.imported_rows}</p>
          <p><strong>Rejected Rows:</strong> {vendor.rejected_rows}</p>
        </div>
      </div>

      <h4>Upload History</h4>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>File Name</th>
            <th>Uploaded</th>
            <th>Imported</th>
            <th>Rejected</th>
          </tr>
        </thead>
        <tbody>
          {vendor.upload_history.map((h, idx) => (
            <tr key={idx}>
              <td>{h.file_name}</td>
              <td>{new Date(h.uploaded_at).toLocaleString()}</td>
              <td>{h.rows_imported}</td>
              <td>{h.rows_rejected}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default VendorDetails;