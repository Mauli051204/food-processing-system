import React from 'react';

function ErrorState({ message = 'Something went wrong. Please try again.', onRetry }) {
  return (
    <div className="alert alert-danger d-flex justify-content-between align-items-center">
      <span>{message}</span>
      {onRetry && (
        <button className="btn btn-sm btn-outline-danger" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export default ErrorState;