import React from 'react';
import EmptyState from './EmptyState';

function DataTable({ columns, data, renderRow, emptyMessage }) {
  if (!data || data.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="table-responsive">
      <table className="table table-striped table-hover align-middle">
        <thead className="table-light">
          <tr>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => renderRow(row, idx))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;