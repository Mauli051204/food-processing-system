import React from 'react';
import { FiBell, FiUser } from 'react-icons/fi';
import { Link } from 'react-router-dom';

function Navbar({ user, unreadCount, breadcrumb }) {
  return (
    <nav className="navbar navbar-light bg-white border-bottom px-4 py-2 d-flex justify-content-between">
      <span className="text-muted">{breadcrumb}</span>
      <div className="d-flex align-items-center gap-3">
        <Link to="/admin/notifications" className="position-relative text-dark">
          <FiBell size={20} />
          {unreadCount > 0 && (
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem' }}>
              {unreadCount}
            </span>
          )}
        </Link>
        <div className="d-flex align-items-center gap-2">
          <FiUser />
          <span>{user?.name || user?.email || 'Admin'}</span>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;