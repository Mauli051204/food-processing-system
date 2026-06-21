import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RoleLayout from '../layouts/RoleLayout';
import RoleGuard from '../components/admin/RoleGuard';
import NotificationsPage from '../pages/shared/NotificationsPage';

import ProductionDashboard from '../pages/production/ProductionDashboard';
import EncryptedFiles from '../pages/production/EncryptedFiles';
import KeyRequests from '../pages/production/KeyRequests';
import Downloads from '../pages/production/Downloads';
import DownloadHistory from '../pages/production/DownloadHistory';
import ProductionStatistics from '../pages/production/ProductionStatistics';

function ProductionRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <RoleGuard allowedRole="production">
            <RoleLayout role="production" />
          </RoleGuard>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ProductionDashboard />} />
        <Route path="encrypted-files" element={<EncryptedFiles />} />
        <Route path="key-requests" element={<KeyRequests />} />
        <Route path="downloads" element={<Downloads />} />
        <Route path="download-history" element={<DownloadHistory />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="statistics" element={<ProductionStatistics />} />
      </Route>
    </Routes>
  );
}

export default ProductionRoutes;