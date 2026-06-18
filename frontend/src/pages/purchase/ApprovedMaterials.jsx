import React, { useEffect, useState } from 'react';
import { getApprovedMaterials, sendToTech } from '../../api/purchaseApi';

function ApprovedMaterials() {
  const [materials, setMaterials] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchMaterials = () => {
    setLoading(true);
    getApprovedMaterials()
      .then((res) => setMaterials(res.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const handleSendToTech = async () => {
    try {
      const res = await sendToTech(selectedIds);
      setMessage(res.data.message);
      setSelectedIds([]);
      fetchMaterials();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to send to tech.');
    }
  };

  if (loading) return <div className="container mt-5">Loading...</div>;

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Approved Materials</h2>
      {message && <div className="alert alert-info">{message}</div>}

      <button
        className="btn btn-primary mb-3"
        disabled={selectedIds.length === 0}
        onClick={handleSendToTech}
      >
        Send To Tech ({selectedIds.length})
      </button>

      <table className="table table-striped">
        <thead>
          <tr>
            <th></th>
            <th>Material</th>
            <th>Quantity</th>
            <th>Cost</th>
            <th>Approved By</th>
            <th>Approved At</th>
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
              <td>{m.material_name}</td>
              <td>{m.edited_quantity}</td>
              <td>{m.edited_cost}</td>
              <td>{m.purchase_user_name}</td>
              <td>{new Date(m.approved_at).toLocaleString()}</td>
              <td>{m.sent_to_tech ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ApprovedMaterials;