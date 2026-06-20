import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllReadNotifications,
} from '../../services/notificationApi';
import Loader from '../../components/admin/Loader';

const TYPE_BADGE = {
  PURCHASE_APPROVAL: 'success',
  PURCHASE_REJECTION: 'danger',
  TECH_NEW_MATERIALS: 'info',
  KEY_APPROVAL_NEEDED: 'warning',
  KEY_REQUEST_APPROVED: 'success',
  KEY_REQUEST_REJECTED: 'danger',
  KEY_REQUEST_PENDING: 'warning',
  USER_APPROVAL: 'success',
  USER_REJECTION: 'danger',
  USER_DEACTIVATED: 'secondary',
};

function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    getNotifications({ search, filter, page })
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
      fetchData();
    } catch (err) {
      toast.error('Failed to mark as read.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await markAllNotificationsRead();
      toast.success(res.data.message);
      fetchData();
    } catch (err) {
      toast.error('Failed to mark all as read.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      toast.success('Notification deleted.');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete.');
    }
  };

  const handleDeleteAllRead = async () => {
    try {
      const res = await deleteAllReadNotifications();
      toast.success(res.data.message);
      fetchData();
    } catch (err) {
      toast.error('Failed to delete read notifications.');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Notifications</h2>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={handleMarkAllRead}>Mark All Read</button>
          <button className="btn btn-outline-danger btn-sm" onClick={handleDeleteAllRead}>Delete All Read</button>
        </div>
      </div>

      <div className="d-flex gap-2 mb-3 flex-wrap">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchData(); }} className="d-flex gap-2">
          <input
            type="text"
            className="form-control"
            placeholder="Search notifications"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-outline-primary">Search</button>
        </form>
        <select className="form-select w-auto" value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
          <option value="">All</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>
      </div>

      {loading ? (
        <Loader />
      ) : notifications.length === 0 ? (
        <div className="text-center text-muted py-5">No notifications found.</div>
      ) : (
        <>
          {notifications.map((n) => (
            <div key={n.id} className={`card mb-2 ${!n.is_read ? 'border-primary' : ''}`}>
              <div className="card-body d-flex justify-content-between align-items-start">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <strong>{n.title}</strong>
                    <span className={`badge bg-${TYPE_BADGE[n.notification_type] || 'secondary'}`}>{n.notification_type}</span>
                    {!n.is_read && <span className="badge bg-primary">New</span>}
                  </div>
                  <div className="text-muted small">{n.message}</div>
                  <div className="text-muted small mt-1">{new Date(n.created_at).toLocaleString()}</div>
                </div>
                <div className="d-flex gap-1">
                  {!n.is_read && (
                    <button className="btn btn-sm btn-outline-primary" onClick={() => handleMarkRead(n.id)}>Mark Read</button>
                  )}
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(n.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}

          {pagination && pagination.total_pages > 1 && (
            <div className="d-flex justify-content-between mt-3">
              <button className="btn btn-outline-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <span>Page {pagination.current_page} of {pagination.total_pages}</span>
              <button className="btn btn-outline-secondary" disabled={page >= pagination.total_pages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default NotificationsPage;