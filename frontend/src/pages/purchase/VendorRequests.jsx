import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getVendorRequests } from '../../services/purchaseApi';
import Loader from '../../components/admin/Loader';

function VendorRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    getVendorRequests({ search, status: statusFilter, page })
      .then((res) => {
        setRequests(res.data.data);
        setPagination(res.data.pagination);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  return (
    <div>
      <h2 className="mb-4">Vendor Requests</h2>

      <div className="d-flex gap-2 mb-3 flex-wrap">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchData(); }} className="d-flex gap-2">
          <input type="text" className="form-control" placeholder="Search vendor or company" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button type="submit" className="btn btn-outline-primary">Search</button>
        </form>
        <select className="form-select w-auto" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {loading ? (
        <Loader />
      ) : requests.length === 0 ? (
        <p className="text-muted">No vendor requests found.</p>
      ) : (
        <>
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Company</th>
                <th>Registration Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>{r.vendor_name}</td>
                  <td>{r.company}</td>
                  <td>{new Date(r.upload_date).toLocaleDateString()}</td>
                  <td><span className="badge bg-secondary">{r.status}</span></td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => navigate(`/purchase/vendor/${r.vendor_id}`)}>
                      View Details
                    </button>
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

export default VendorRequests;