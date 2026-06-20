import React, { useState, useEffect, useRef } from 'react';
import { FiBell } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { getLatestNotifications, getUnreadCount, markNotificationRead } from '../../services/notificationApi';

function NotificationBell({ basePath }) {
  const [open, setOpen] = useState(false);
  const [latest, setLatest] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef(null);

  const fetchData = () => {
    getUnreadCount().then((res) => setUnreadCount(res.data.unread_count)).catch(() => {});
    getLatestNotifications().then((res) => setLatest(res.data.data)).catch(() => {});
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = () => {
    setOpen((prev) => !prev);
    if (!open) fetchData();
  };

  const handleItemClick = async (notification) => {
    if (!notification.is_read) {
      try {
        await markNotificationRead(notification.id);
        fetchData();
      } catch (err) {
        // ignore — non-critical
      }
    }
  };

  return (
    <div className="position-relative" ref={ref}>
      <button className="btn btn-light position-relative" onClick={handleOpen}>
        <FiBell size={18} />
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem' }}>
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="position-absolute end-0 mt-2 bg-white border rounded shadow" style={{ width: '320px', zIndex: 1000 }}>
          <div className="p-2 border-bottom d-flex justify-content-between align-items-center">
            <strong className="small">Notifications</strong>
            <button className="btn btn-sm btn-link p-0" onClick={fetchData}>Refresh</button>
          </div>
          {latest.length === 0 ? (
            <div className="p-3 text-center text-muted small">No notifications</div>
          ) : (
            latest.map((n) => (
              <Link
                key={n.id}
                to={`${basePath}/notifications`}
                className={`d-block p-2 border-bottom text-decoration-none text-dark ${!n.is_read ? 'bg-light' : ''}`}
                onClick={() => handleItemClick(n)}
              >
                <div className="small fw-bold">{n.title}</div>
                <div className="small text-muted text-truncate">{n.message}</div>
                <div className="small text-muted">{new Date(n.created_at).toLocaleString()}</div>
              </Link>
            ))
          )}
          <Link to={`${basePath}/notifications`} className="d-block text-center p-2 small" onClick={() => setOpen(false)}>
            View All
          </Link>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;