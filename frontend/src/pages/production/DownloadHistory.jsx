import React, { useEffect, useState } from 'react';
import { getDownloadHistory } from '../../services/productionApi';
import Loader from '../../components/admin/Loader';

function DownloadHistory() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    getDownloadHistory({ search, page })
      .then((res) => {
        setRecords(res.data.data);
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
      <h2 className="mb-4">Download History</h2>

      <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchData(); }} className="mb-3 d-flex gap-2" style={{ maxWidth: '400px' }}>
        <input type="text" className="form-control" placeholder="Search by vendor" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button type="submit" className="btn btn-outline-primary">Search</button>
      </form>

      {loading ? (
        <Loader />
      ) : records.length === 0 ? (
        <p className="text-muted">No downloads found.</p>
      ) : (
        <>
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Material</th>
                <th>Vendor</th>
                <th>File</th>
                <th>Downloaded At</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td>{r.material_name}</td>
                  <td>{r.vendor_name}</td>
                  <td>{r.downloaded_file_path}</td>
                  <td className="text-muted small">{new Date(r.downloaded_at).toLocaleString()}</td>
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

export default DownloadHistory;