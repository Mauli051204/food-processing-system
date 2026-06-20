import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import RoleGuard from '../components/admin/RoleGuard';

import AdminDashboard from '../pages/admin/AdminDashboard';
import Users from '../pages/admin/Users';
import UserDetails from '../pages/admin/UserDetails';
import PendingApprovals from '../pages/admin/PendingApprovals';
import KeyRequests from '../pages/admin/KeyRequests';
import EncryptionManagement from '../pages/admin/EncryptionManagement';
import DownloadHistory from '../pages/admin/DownloadHistory';
import AuditLogs from '../pages/admin/AuditLogs';
import Notifications from '../pages/admin/Notifications';
import Reports from '../pages/admin/Reports';
import SystemSettings from '../pages/admin/SystemSettings';

function AdminRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <RoleGuard allowedRole="admin">
            <AdminLayout />
          </RoleGuard>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="users/:id" element={<UserDetails />} />
        <Route path="pending-approvals" element={<PendingApprovals />} />
        <Route path="key-requests" element={<KeyRequests />} />
        <Route path="encryption-history" element={<EncryptionManagement />} />
        <Route path="download-history" element={<DownloadHistory />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="reports" element={<Reports />} />
        <Route path="system-settings" element={<SystemSettings />} />
      </Route>
    </Routes>
  );
}

export default AdminRoutes;