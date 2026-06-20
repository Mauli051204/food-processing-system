import React, { useEffect, useState } from 'react';
import { getAuditLogs } from '../../services/adminApi';
import DataTable from '../../components/admin/DataTable';
import SearchBar from '../../components/admin/SearchBar';
import Pagination from '../../components/admin/Pagination';
import Loader from '../../components/admin/Loader';
import { usePagination } from '../../hooks/usePagination';

const actionColors = {
  USER_APPROVED: 'success',
  USER_REJECTED: 'danger',
  USER_ACTIVATED: 'success',
  USER_DEACTIVATED: 'secondary',
  FILE_DOWNLOADED: 'info',
  FILE_DECRYPTED: 'primary',
  FILE_ENCRYPTED: 'dark',
  KEY_REQUESTED: 'warning',
  KEY_REQUEST_APPROVED: 'success',
  KEY_REQUEST_REJECTED: 'danger',
};

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const { page, setPage, pagination, setPagination } = usePagination();

  const fetchData = () => {
    setLoading(true);
    getAuditLogs({ search, action: actionFilter, date_from: dateFrom, date_to: dateTo, page })
      .then((res) => {
        setLogs(res.data.data);
        setPagination(res.data.pagination);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div>
      <h2 className="mb-4">Audit Logs</h2>

      <div className="d-flex gap-2 mb-3 flex-wrap align-items-end">
        <SearchBar onSearch={(val) => { setSearch(val); setPage(1); fetchData(); }} placeholder="Search description" />
        <input type="text" className="form-control w-auto" placeholder="Action filter" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} />
        <div>
          <label className="form-label small mb-0">From</label>
          <input type="date" className="form-control" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div>
          <label className="form-label small mb-0">To</label>
          <input type="date" className="form-control" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <button className="btn btn-outline-primary" onClick={() => { setPage(1); fetchData(); }}>Apply</button>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <>
          <DataTable
            columns={['User', 'Role', 'Action', 'Description', 'Timestamp']}
            data={logs}
            emptyMessage="No audit logs found."
            renderRow={(log) => (
              <tr key={log.id}>
                <td>{log.user_email || '-'}</td>
                <td>{log.role}</td>
                <td><span className={`badge bg-${actionColors[log.action] || 'secondary'}`}>{log.action}</span></td>
                <td className="small">{log.description}</td>
                <td className="text-muted small">{new Date(log.timestamp).toLocaleString()}</td>
              </tr>
            )}
          />
          <Pagination pagination={pagination} page={page} setPage={setPage} />
        </>
      )}
    </div>
  );
}

export default AuditLogs;