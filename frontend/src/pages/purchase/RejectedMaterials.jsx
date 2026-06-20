import React, { useEffect, useState } from 'react';
import { getRejectedMaterials } from '../../services/purchaseApi';
import Loader from '../../components/admin/Loader';

function RejectedMaterials() {
  const [materials, setMaterials] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    getRejectedMaterials({ search, page })
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

  return (
    <div>
      <h2 className="mb-4">Rejected Materials</h2>

      <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchData(); }} className="mb-3 d-flex gap-2" style={{ maxWidth: '400px' }}>
        <input type="text" className="form-control" placeholder="Search material name" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button type="submit" className="btn btn-outline-primary">Search</button>
      </form>

      {loading ? (
        <Loader />
      ) : materials.length === 0 ? (
        <p className="text-muted">No rejected materials found.</p>
      ) : (
        <>
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Rejected Date</th>
                <th>Rejected Reason</th>
                <th>Rejected By</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m) => (
                <tr key={m.id}>
                  <td>{m.material_code}</td>
                  <td>{m.material_name}</td>
                  <td className="text-muted small">{new Date(m.rejected_at).toLocaleString()}</td>
                  <td>{m.rejection_reason}</td>
                  <td>{m.purchase_user_name}</td>
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

export default RejectedMaterials;