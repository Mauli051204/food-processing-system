import React, { useEffect, useState } from 'react';
import { getDownloadHistory } from '../../services/adminApi';
import DataTable from '../../components/admin/DataTable';
import SearchBar from '../../components/admin/SearchBar';
import Pagination from '../../components/admin/Pagination';
import Loader from '../../components/admin/Loader';
import { usePagination } from '../../hooks/usePagination';

function DownloadHistory() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { page, setPage, pagination, setPagination } = usePagination();

  const fetchData = () => {
    setLoading(true);
    getDownloadHistory({ search, page })
      .then((res) => {
        setRecords(res.data.data);
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
      <h2 className="mb-4">Download History</h2>

      <SearchBar onSearch={(val) => { setSearch(val); setPage(1); fetchData(); }} placeholder="Search by user email" />

      {loading ? (
        <Loader />
      ) : (
        <>
          <DataTable
            columns={['Material', 'User', 'File', 'Downloaded At']}
            data={records}
            emptyMessage="No downloads found."
            renderRow={(r) => (
              <tr key={r.id}>
                <td>{r.material_name}</td>
                <td>{r.user_name}</td>
                <td>{r.downloaded_file_path}</td>
                <td className="text-muted small">{new Date(r.downloaded_at).toLocaleString()}</td>
              </tr>
            )}
          />
          <Pagination pagination={pagination} page={page} setPage={setPage} />
        </>
      )}
    </div>
  );
}

export default DownloadHistory;