import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from '../components/shared/Sidebar';
import Navbar from '../components/shared/Navbar';
import { useAuth } from '../hooks/useAuth';
import { logout } from '../services/authApi';
import { NAV_CONFIG } from '../config/navConfig';

function RoleLayout({ role }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const config = NAV_CONFIG[role];

  React.useEffect(() => {
    const handleExpired = () => {
      toast.error('Session expired. Please log in again.');
      navigate('/login');
    };
    const handleForbidden = () => {
      toast.error('You do not have permission to perform this action.');
    };
    const handleServerError = () => {
      toast.error('A server error occurred. Please try again.');
    };

    window.addEventListener('auth:expired', handleExpired);
    window.addEventListener('auth:forbidden', handleForbidden);
    window.addEventListener('app:server-error', handleServerError);

    return () => {
      window.removeEventListener('auth:expired', handleExpired);
      window.removeEventListener('auth:forbidden', handleForbidden);
      window.removeEventListener('app:server-error', handleServerError);
    };
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login');
    }
  };

  const breadcrumb = location.pathname.split('/').filter(Boolean).join(' / ');

  return (
    <div className="d-flex">
      <Sidebar config={config} onLogout={handleLogout} />
      <div className="flex-grow-1">
        <Navbar user={user} breadcrumb={breadcrumb} basePath={config.basePath} />
        <div className="p-4">
          <Outlet />
        </div>
        <footer className="text-center text-muted py-3 border-top mt-5">
          Food Processing System
        </footer>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default RoleLayout;