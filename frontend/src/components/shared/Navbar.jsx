import React from 'react';
import { FiUser } from 'react-icons/fi';
import NotificationBell from './NotificationBell';

function Navbar({ user, breadcrumb, basePath }) {
  return (
    <nav className="navbar navbar-light bg-white border-bottom px-4 py-2 d-flex justify-content-between">
      <span className="text-muted">{breadcrumb}</span>
      <div className="d-flex align-items-center gap-3">
        <NotificationBell basePath={basePath} />
        <div className="d-flex align-items-center gap-2">
          <FiUser />
          <span>{user?.name || user?.email || 'User'}</span>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;