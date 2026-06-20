import React from 'react';

function ConfirmationModal({ show, title, message, onConfirm, onCancel, confirmLabel = 'Confirm', confirmVariant = 'primary', loading }) {
  if (!show) return null;

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" onClick={onCancel}></button>
          </div>
          <div className="modal-body">
            <p>{message}</p>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
            <button className={`btn btn-${confirmVariant}`} onClick={onConfirm} disabled={loading}>
              {loading ? 'Processing...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;