import React, { useEffect, useState } from 'react';
import { getMaterials } from '../../services/vendorApi';
import Loader from '../../components/admin/Loader';

function MaterialsList({ statusFilter, title }) {
  const [materials, setMaterials] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    getMaterials({ status: statusFilter, search })
      .then((res) => setMaterials(res.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  return (
    <div>
      <h2 className="mb-4">{title}</h2>

      <form onSubmit={(e) => { e.preventDefault(); fetchData(); }} className="mb-3 d-flex gap-2" style={{ maxWidth: '400px' }}>
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
        <Loader />
      ) : materials.length === 0 ? (
        <p className="text-muted">No materials found.</p>
      ) : (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Quantity</th>
              <th>Cost</th>
              <th>Supplier</th>
              <th>Expiry</th>
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
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default MaterialsList;