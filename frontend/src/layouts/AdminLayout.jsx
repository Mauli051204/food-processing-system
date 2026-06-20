// C:\Mauli\GradTwin\Project\food-processing-system\frontend\src\layouts\AdminLayout.jsx
import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from '../components/admin/Sidebar';
import Navbar from '../components/admin/Navbar';
import { useAuth } from '../hooks/useAuth';
import { logout } from '../services/authApi';
import { getNotifications } from '../services/adminApi';

function AdminLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    getNotifications({ filter: 'unread', page_size: 1 })
      .then((res) => setUnreadCount(res.data.pagination?.total_records || 0))
      .catch(() => {});
  }, [location.pathname]);

  useEffect(() => {
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
      <Sidebar onLogout={handleLogout} />
      <div className="flex-grow-1">
        <Navbar user={user} unreadCount={unreadCount} breadcrumb={breadcrumb} />
        <div className="p-4">
          <Outlet />
        </div>
        <footer className="text-center text-muted py-3 border-top mt-5">
          Food Processing System — Admin Panel
        </footer>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default AdminLayout;