import React, { useState } from 'react';

function RejectReasonModal({ show, title = 'Reject', onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState('');

  if (!show) return null;

  const handleConfirm = () => {
    onConfirm(reason);
    setReason('');
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" onClick={onCancel}></button>
          </div>
          <div className="modal-body">
            <label className="form-label">Reason</label>
            <textarea
              className="form-control"
              rows="3"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter rejection reason..."
            />
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
            <button className="btn btn-danger" onClick={handleConfirm} disabled={loading || !reason.trim()}>
              {loading ? 'Processing...' : 'Reject'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RejectReasonModal;