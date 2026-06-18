import React, { useState } from 'react';
import { rejectMaterial } from '../../api/purchaseApi';

const REASONS = ['Invalid Data', 'Expired Material', 'Duplicate Material', 'Low Quality', 'Other'];

function RejectMaterialModal({ material, onClose, onSuccess }) {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReject = async () => {
    const finalReason = reason === 'Other' ? customReason : reason;
    if (!finalReason.trim()) {
      setError('Please select or enter a rejection reason.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await rejectMaterial(material.id, finalReason);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject material.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Reject Material: {material.material_name}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <label className="form-label">Reason</label>
            <select className="form-select mb-2" value={reason} onChange={(e) => setReason(e.target.value)}>
              <option value="">Select a reason</option>
              {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            {reason === 'Other' && (
              <input
                type="text"
                className="form-control"
                placeholder="Enter custom reason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
              />
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-danger" onClick={handleReject} disabled={loading}>
              {loading ? 'Rejecting...' : 'Reject Material'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RejectMaterialModal;