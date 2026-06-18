import React, { useEffect, useState } from 'react';
import { getMaterials, approveMaterial } from '../../api/purchaseApi';
import EditMaterialModal from '../../components/purchase/EditMaterialModal';
import RejectMaterialModal from '../../components/purchase/RejectMaterialModal';

function MaterialReview() {
  const [materials, setMaterials] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [message, setMessage] = useState('');

  const fetchMaterials = () => {
    setLoading(true);
    getMaterials({ search, page, status: 'APPROVED' })
      .then((res) => {
        setMaterials(res.data.data);
        setPagination(res.data.pagination);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMaterials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleApprove = async (material) => {
    try {
      await approveMaterial(material.id, {});
      setMessage(`${material.material_name} approved.`);
      fetchMaterials();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Approval failed.');
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Material Review</h2>
      {message && <div className="alert alert-info">{message}</div>}

      <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchMaterials(); }} className="mb-3 d-flex gap-2">
        <input
          type="text"
          className="form-control"
          placeholder="Search material name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="btn btn-outline-primary">Search</button>
      </form>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Material ID</th>
                <th>Name</th>
                <th>Quantity</th>
                <th>Cost</th>
                <th>Supplier</th>
                <th>Expiry</th>
                <th>Vendor</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m) => (
                <tr key={m.id}>
                  <td>{m.material_code}</td>
                  <td>{m.material_name}</td>
                  <td>{m.quantity}</td>
                  <td>{m.cost}</td>
                  <td>{m.supplier}</td>
                  <td>{m.expiry_date}</td>
                  <td>{m.vendor_name}</td>
                  <td className="d-flex gap-1">
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => setEditTarget(m)}>Edit</button>
                    <button className="btn btn-sm btn-success" onClick={() => handleApprove(m)}>Approve</button>
                    <button className="btn btn-sm btn-danger" onClick={() => setRejectTarget(m)}>Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pagination && (
            <div className="d-flex justify-content-between">
              <button className="btn btn-outline-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <span>Page {pagination.current_page} of {pagination.total_pages}</span>
              <button className="btn btn-outline-secondary" disabled={page >= pagination.total_pages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          )}
        </>
      )}

      {editTarget && (
        <EditMaterialModal
          material={editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={fetchMaterials}
        />
      )}
      {rejectTarget && (
        <RejectMaterialModal
          material={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onSuccess={fetchMaterials}
        />
      )}
    </div>
  );
}

export default MaterialReview;