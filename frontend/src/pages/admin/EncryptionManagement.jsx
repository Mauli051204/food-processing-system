import React, { useEffect, useState } from 'react';
import { getEncryptionHistory } from '../../services/adminApi';
import DataTable from '../../components/admin/DataTable';
import SearchBar from '../../components/admin/SearchBar';
import Pagination from '../../components/admin/Pagination';
import Loader from '../../components/admin/Loader';
import { usePagination } from '../../hooks/usePagination';

function EncryptionManagement() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const { page, setPage, pagination, setPagination } = usePagination();

  const fetchData = () => {
    setLoading(true);
    getEncryptionHistory({ search, status: statusFilter, page })
      .then((res) => {
        setRecords(res.data.data);
        setPagination(res.data.pagination);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  return (
    <div>
      <h2 className="mb-4">Encryption Management</h2>

      <div className="d-flex gap-3 mb-3 flex-wrap">
        <SearchBar onSearch={(val) => { setSearch(val); setPage(1); fetchData(); }} placeholder="Search material" />
        <select className="form-select w-auto" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="TXT_GENERATED">TXT Generated</option>
          <option value="ENCRYPTED">Encrypted</option>
          <option value="KEY_REQUESTED">Key Requested</option>
          <option value="KEY_APPROVED">Key Approved</option>
          <option value="DECRYPTED">Decrypted</option>
        </select>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <>
          <DataTable
            columns={['Material', 'Vendor', 'Encrypted', 'Status', 'Tech User', 'Date']}
            data={records}
            emptyMessage="No encryption records found."
            renderRow={(r) => (
              <tr key={r.id}>
                <td>{r.material_name}</td>
                <td>{r.vendor_name}</td>
                <td>{r.has_encrypted_file ? 'Yes' : 'No'}</td>
                <td><span className="badge bg-info text-dark">{r.status}</span></td>
                <td>{r.generated_by_name}</td>
                <td className="text-muted small">{new Date(r.created_at).toLocaleString()}</td>
              </tr>
            )}
          />
          <Pagination pagination={pagination} page={page} setPage={setPage} />
        </>
      )}
    </div>
  );
}

export default EncryptionManagement;