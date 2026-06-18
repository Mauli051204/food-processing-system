import React, { useState } from 'react';
import { editMaterial } from '../../api/purchaseApi';

function EditMaterialModal({ material, onClose, onSuccess }) {
  const [quantity, setQuantity] = useState(material.quantity);
  const [cost, setCost] = useState(material.cost);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setError('');
    setLoading(true);
    try {
      await editMaterial(material.id, { quantity, cost });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update material.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Edit Material: {material.material_name}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="mb-3">
              <label className="form-label">Quantity</label>
              <input type="number" className="form-control" value={quantity} onChange={(e) => setQuantity(e.target.value)} min="0.01" step="0.01" />
            </div>
            <div className="mb-3">
              <label className="form-label">Cost</label>
              <input type="number" className="form-control" value={cost} onChange={(e) => setCost(e.target.value)} min="0.01" step="0.01" />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditMaterialModal;