import React from 'react';

function Pagination({ pagination, page, setPage }) {
  if (!pagination || pagination.total_pages <= 1) return null;

  return (
    <nav className="d-flex justify-content-between align-items-center mt-3">
      <button
        className="btn btn-outline-secondary btn-sm"
        disabled={page <= 1}
        onClick={() => setPage((p) => p - 1)}
      >
        Previous
      </button>
      <span className="text-muted small">
        Page {pagination.current_page} of {pagination.total_pages} ({pagination.total_records} records)
      </span>
      <button
        className="btn btn-outline-secondary btn-sm"
        disabled={page >= pagination.total_pages}
        onClick={() => setPage((p) => p + 1)}
      >
        Next
      </button>
    </nav>
  );
}

export default Pagination;