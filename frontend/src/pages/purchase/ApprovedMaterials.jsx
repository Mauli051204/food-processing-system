import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getApprovedMaterials, sendToTech } from '../../services/purchaseApi';
import Loader from '../../components/admin/Loader';

function ApprovedMaterials() {
  const [materials, setMaterials] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);

  const fetchData = () => {
    setLoading(true);
    getApprovedMaterials({ search, page })
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

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSendToTech = async () => {
    if (selectedIds.length === 0) {
      toast.error('Select at least one material first.');
      return;
    }
    try {
      const res = await sendToTech(selectedIds);
      toast.success(res.data.message);
      setSelectedIds([]);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send to Tech.');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Approved Materials</h2>
        <button className="btn btn-primary btn-sm" onClick={handleSendToTech} disabled={selectedIds.length === 0}>
          Send Selected to Tech ({selectedIds.length})
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchData(); }} className="mb-3 d-flex gap-2" style={{ maxWidth: '400px' }}>
        <input type="text" className="form-control" placeholder="Search material name" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button type="submit" className="btn btn-outline-primary">Search</button>
      </form>

      {loading ? (
        <Loader />
      ) : materials.length === 0 ? (
        <p className="text-muted">No approved materials found.</p>
      ) : (
        <>
          <table className="table table-striped">
            <thead>
              <tr>
                <th></th>
                <th>Code</th>
                <th>Name</th>
                <th>Quantity</th>
                <th>Cost</th>
                <th>Approved Date</th>
                <th>Approved By</th>
                <th>Sent to Tech</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m) => (
                <tr key={m.id}>
                  <td>
                    {!m.sent_to_tech && (
                      <input type="checkbox" checked={selectedIds.includes(m.id)} onChange={() => toggleSelect(m.id)} />
                    )}
                  </td>
                  <td>{m.material_code}</td>
                  <td>{m.material_name}</td>
                  <td>{m.edited_quantity}</td>
                  <td>{m.edited_cost}</td>
                  <td className="text-muted small">{new Date(m.approved_at).toLocaleString()}</td>
                  <td>{m.purchase_user_name}</td>
                  <td>
                    {m.sent_to_tech
                      ? <span className="badge bg-success">Sent</span>
                      : <span className="badge bg-warning">Not Sent</span>}
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
    </div>
  );
}

export default ApprovedMaterials;