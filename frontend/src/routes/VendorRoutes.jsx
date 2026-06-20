import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RoleLayout from '../layouts/RoleLayout';
import RoleGuard from '../components/admin/RoleGuard';
import NotificationsPage from '../pages/shared/NotificationsPage';

import VendorDashboard from '../pages/vendor/VendorDashboard';
import VendorProfile from '../pages/vendor/VendorProfile';
import UploadMaterial from '../pages/vendor/UploadMaterial';
import UploadHistory from '../pages/vendor/UploadHistory';
import MaterialsList from '../pages/vendor/MaterialsList';
import VendorStatistics from '../pages/vendor/VendorStatistics';

function VendorRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <RoleGuard allowedRole="vendor">
            <RoleLayout role="vendor" />
          </RoleGuard>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<VendorDashboard />} />
        <Route path="profile" element={<VendorProfile />} />
        <Route path="upload" element={<UploadMaterial />} />
        <Route path="upload-history" element={<UploadHistory />} />
        <Route path="approved-materials" element={<MaterialsList statusFilter="APPROVED" title="Approved Materials (Sent to Purchase)" />} />
        <Route path="rejected-materials" element={<MaterialsList statusFilter="REJECTED" title="Rejected Materials" />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="statistics" element={<VendorStatistics />} />
      </Route>
    </Routes>
  );
}

export default VendorRoutes;