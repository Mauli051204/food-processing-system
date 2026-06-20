import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReceivedMaterials } from '../../services/techApi';
import Loader from '../../components/admin/Loader';

function ReceivedMaterials() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchBatches = () => {
    setLoading(true);
    getReceivedMaterials({ search })
      .then((res) => setBatches(res.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  return (
    <div>
      <h2 className="mb-4">Received Materials</h2>

      <form onSubmit={(e) => { e.preventDefault(); fetchBatches(); }} className="mb-3 d-flex gap-2" style={{ maxWidth: '400px' }}>
        <input type="text" className="form-control" placeholder="Search by vendor" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button type="submit" className="btn btn-outline-primary">Search</button>
      </form>

      {loading ? (
        <Loader />
      ) : batches.length === 0 ? (
        <p className="text-muted">No materials awaiting processing.</p>
      ) : (
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Material Count</th>
              <th>Approved Date</th>
              <th>Purchase Team</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((b) => (
              <tr key={b.batch_id}>
                <td>{b.vendor_name}</td>
                <td>{b.material_count}</td>
                <td>{new Date(b.upload_date).toLocaleString()}</td>
                <td>{b.purchase_team_member}</td>
                <td><span className="badge bg-warning">{b.status}</span></td>
                <td>
                  <button className="btn btn-sm btn-primary" onClick={() => navigate(`/tech/process/${b.batch_id}`)}>
                    Process Batch
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ReceivedMaterials;