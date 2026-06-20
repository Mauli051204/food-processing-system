import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getNotifications, markNotificationRead } from '../../services/adminApi';
import DataTable from '../../components/admin/DataTable';
import Pagination from '../../components/admin/Pagination';
import Loader from '../../components/admin/Loader';
import { usePagination } from '../../hooks/usePagination';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const { page, setPage, pagination, setPagination } = usePagination();

  const fetchData = () => {
    setLoading(true);
    getNotifications({ filter, page })
      .then((res) => {
        setNotifications(res.data.data);
        setPagination(res.data.pagination);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filter]);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      toast.success('Marked as read.');
      fetchData();
    } catch (err) {
      toast.error('Failed to update.');
    }
  };

  return (
    <div>
      <h2 className="mb-4">Notifications</h2>

      <select className="form-select w-auto mb-3" value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
        <option value="">All</option>
        <option value="unread">Unread</option>
        <option value="read">Read</option>
      </select>

      {loading ? (
        <Loader />
      ) : (
        <>
          <DataTable
            columns={['User', 'Title', 'Message', 'Type', 'Status', 'Date', 'Actions']}
            data={notifications}
            emptyMessage="No notifications found."
            renderRow={(n) => (
              <tr key={n.id} className={!n.is_read ? 'table-warning' : ''}>
                <td>{n.user_email}</td>
                <td>{n.title}</td>
                <td className="small">{n.message}</td>
                <td><span className="badge bg-secondary">{n.notification_type}</span></td>
                <td>{n.is_read ? <span className="badge bg-success">Read</span> : <span className="badge bg-warning">Unread</span>}</td>
                <td className="text-muted small">{new Date(n.created_at).toLocaleString()}</td>
                <td>
                  {!n.is_read && (
                    <button className="btn btn-sm btn-outline-primary" onClick={() => handleMarkRead(n.id)}>Mark Read</button>
                  )}
                </td>
              </tr>
            )}
          />
          <Pagination pagination={pagination} page={page} setPage={setPage} />
        </>
      )}
    </div>
  );
}

export default Notifications;