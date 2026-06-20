import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getMaterialReview, editMaterial, approveMaterial, rejectMaterial } from '../../services/purchaseApi';
import Loader from '../../components/admin/Loader';
import RejectReasonModal from '../../components/admin/RejectReasonModal';

function MaterialReview() {
  const [materials, setMaterials] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState(null);
  const [editValues, setEditValues] = useState({ quantity: '', cost: '' });
  const [rejectTarget, setRejectTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = () => {
    setLoading(true);
    getMaterialReview({ search, page, status: 'APPROVED' })
      .then((res) => {
        setMaterials(res.data.data);
        setPagination(res.data.pagination);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const startEdit = (m) => {
    setEditTarget(m.id);
    setEditValues({ quantity: m.quantity, cost: m.cost });
  };

  const handleSaveEdit = async (id) => {
    setActionLoading(true);
    try {
      await editMaterial(id, { quantity: editValues.quantity, cost: editValues.cost });
      toast.success('Material updated.');
      setEditTarget(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update material.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setActionLoading(true);
    try {
      await approveMaterial(id, {});
      toast.success('Material approved. Find it in Approved Materials to send to Tech.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reason) => {
    setActionLoading(true);
    try {
      await rejectMaterial(rejectTarget, reason);
      toast.success('Material rejected.');
      setRejectTarget(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <h2 className="mb-4">Material Review</h2>
      <p className="text-muted small">Materials awaiting your decision. Approved items move to the Approved Materials page where you can send them to Tech.</p>

      <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchData(); }} className="mb-3 d-flex gap-2" style={{ maxWidth: '400px' }}>
        <input type="text" className="form-control" placeholder="Search material name" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button type="submit" className="btn btn-outline-primary">Search</button>
      </form>

      {loading ? (
        <Loader />
      ) : materials.length === 0 ? (
        <p className="text-muted">No materials pending review.</p>
      ) : (
        <>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Vendor</th>
                <th>Quantity</th>
                <th>Cost</th>
                <th>Supplier</th>
                <th>Expiry</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m) => (
                <tr key={m.id}>
                  <td>{m.material_code}</td>
                  <td>{m.material_name}</td>
                  <td>{m.vendor_name}</td>
                  <td>
                    {editTarget === m.id ? (
                      <input type="number" className="form-control form-control-sm" value={editValues.quantity} onChange={(e) => setEditValues((v) => ({ ...v, quantity: e.target.value }))} />
                    ) : m.quantity}
                  </td>
                  <td>
                    {editTarget === m.id ? (
                      <input type="number" className="form-control form-control-sm" value={editValues.cost} onChange={(e) => setEditValues((v) => ({ ...v, cost: e.target.value }))} />
                    ) : m.cost}
                  </td>
                  <td>{m.supplier}</td>
                  <td>{m.expiry_date}</td>
                  <td>
                    <div className="d-flex gap-1 flex-wrap">
                      {editTarget === m.id ? (
                        <>
                          <button className="btn btn-sm btn-success" disabled={actionLoading} onClick={() => handleSaveEdit(m.id)}>Save</button>
                          <button className="btn btn-sm btn-secondary" onClick={() => setEditTarget(null)}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-sm btn-outline-secondary" onClick={() => startEdit(m)}>Edit</button>
                          <button className="btn btn-sm btn-success" disabled={actionLoading} onClick={() => handleApprove(m.id)}>Approve</button>
                          <button className="btn btn-sm btn-danger" onClick={() => setRejectTarget(m.id)}>Reject</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pagination && pagination.total_pages > 1 && (
            <div className="d-flex justify-content-between">
              <button className="btn btn-outline-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <span>Page {pagination.current_page} of {pagination.total_pages}</span>
              <button className="btn btn-outline-secondary" disabled={page >= pagination.total_pages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          )}
        </>
      )}

      <RejectReasonModal show={!!rejectTarget} title="Reject Material" onConfirm={handleReject} onCancel={() => setRejectTarget(null)} loading={actionLoading} />
    </div>
  );
}

export default MaterialReview;