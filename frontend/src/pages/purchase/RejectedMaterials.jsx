import React, { useEffect, useState } from 'react';
import { getRejectedMaterials } from '../../api/purchaseApi';

function RejectedMaterials() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRejectedMaterials()
      .then((res) => setMaterials(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container mt-5">Loading...</div>;

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Rejected Materials</h2>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Material</th>
            <th>Reason</th>
            <th>Rejected By</th>
            <th>Rejected At</th>
          </tr>
        </thead>
        <tbody>
          {materials.map((m) => (
            <tr key={m.id}>
              <td>{m.material_name}</td>
              <td>{m.rejection_reason}</td>
              <td>{m.purchase_user_name}</td>
              <td>{new Date(m.rejected_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default RejectedMaterials;