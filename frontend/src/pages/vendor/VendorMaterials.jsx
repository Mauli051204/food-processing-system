import React, { useEffect, useState } from 'react';
import { getMaterials, sendToPurchase } from '../../api/vendorApi';

function VendorMaterials() {
  const [materials, setMaterials] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchMaterials = () => {
    setLoading(true);
    getMaterials({ search, page })
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

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchMaterials();
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSendToPurchase = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await sendToPurchase(selectedIds);
      setMessage(res.data.message);
      setSelectedIds([]);
      fetchMaterials();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to send to purchase.');
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Uploaded Materials</h2>

      {message && <div className="alert alert-info">{message}</div>}

      <form onSubmit={handleSearch} className="mb-3 d-flex gap-2">
        <input
          type="text"
          className="form-control"
          placeholder="Search by material name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="btn btn-outline-primary">Search</button>
        <button
          type="button"
          className="btn btn-success"
          disabled={selectedIds.length === 0}
          onClick={handleSendToPurchase}
        >
          Send to Purchase ({selectedIds.length})
        </button>
      </form>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th></th>
                <th>Material ID</th>
                <th>Name</th>
                <th>Quantity</th>
                <th>Cost</th>
                <th>Supplier</th>
                <th>Expiry Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m) => (
                <tr key={m.id}>
                  <td>
                    {m.status === 'PENDING' && (
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(m.id)}
                        onChange={() => toggleSelect(m.id)}
                      />
                    )}
                  </td>
                  <td>{m.material_code}</td>
                  <td>{m.material_name}</td>
                  <td>{m.quantity}</td>
                  <td>{m.cost}</td>
                  <td>{m.supplier}</td>
                  <td>{m.expiry_date}</td>
                  <td>{m.status}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {pagination && (
            <div className="d-flex justify-content-between">
              <button
                className="btn btn-outline-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span>Page {pagination.current_page} of {pagination.total_pages}</span>
              <button
                className="btn btn-outline-secondary"
                disabled={page >= pagination.total_pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default VendorMaterials;