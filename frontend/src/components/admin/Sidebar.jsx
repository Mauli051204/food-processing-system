import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiGrid, FiUsers, FiUserCheck, FiKey, FiLock, FiDownload,
  FiFileText, FiBell, FiBarChart2, FiSettings, FiLogOut,
} from 'react-icons/fi';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: <FiGrid /> },
  { to: '/admin/users', label: 'Users', icon: <FiUsers /> },
  { to: '/admin/pending-approvals', label: 'Pending Approvals', icon: <FiUserCheck /> },
  { to: '/admin/key-requests', label: 'Key Requests', icon: <FiKey /> },
  { to: '/admin/encryption-history', label: 'Encryption History', icon: <FiLock /> },
  { to: '/admin/download-history', label: 'Download History', icon: <FiDownload /> },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: <FiFileText /> },
  { to: '/admin/notifications', label: 'Notifications', icon: <FiBell /> },
  { to: '/admin/reports', label: 'Reports', icon: <FiBarChart2 /> },
  { to: '/admin/system-settings', label: 'System Settings', icon: <FiSettings /> },
];

function Sidebar({ onLogout }) {
  return (
    <div className="d-flex flex-column bg-dark text-white p-3" style={{ width: '250px', minHeight: '100vh' }}>
      <h5 className="mb-4">Admin Panel</h5>
      <nav className="nav nav-pills flex-column gap-1 flex-grow-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `nav-link text-white d-flex align-items-center gap-2 ${isActive ? 'active bg-primary' : ''}`
            }
          >
            {item.icon} {item.label}
          </NavLink>
        ))}
      </nav>
      <button className="btn btn-outline-light d-flex align-items-center gap-2 mt-3" onClick={onLogout}>
        <FiLogOut /> Logout
      </button>
    </div>
  );
}

export default Sidebar;