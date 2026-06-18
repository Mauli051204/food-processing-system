import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getVendorRequests } from '../../api/purchaseApi';

function VendorRequests() {
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRequests = () => {
    setLoading(true);
    getVendorRequests({ search, page })
      .then((res) => {
        setRequests(res.data.data);
        setPagination(res.data.pagination);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchRequests();
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Vendor Requests</h2>

      <form onSubmit={handleSearch} className="mb-3 d-flex gap-2">
        <input
          type="text"
          className="form-control"
          placeholder="Search vendor or company"
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
                <th>Vendor</th>
                <th>Company</th>
                <th>Upload Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>{r.vendor_name}</td>
                  <td>{r.company}</td>
                  <td>{new Date(r.upload_date).toLocaleString()}</td>
                  <td>{r.status}</td>
                  <td>
                    <Link to={`/purchase/vendor/${r.vendor_id}`} className="btn btn-sm btn-primary">View</Link>
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
    </div>
  );
}

export default VendorRequests;