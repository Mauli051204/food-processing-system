import React from 'react';

function EmptyState({ message = 'No records found.' }) {
  return (
    <div className="text-center text-muted py-5">
      <p className="mb-0">{message}</p>
    </div>
  );
}

export default EmptyState;