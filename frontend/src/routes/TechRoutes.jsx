import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RoleLayout from '../layouts/RoleLayout';
import RoleGuard from '../components/admin/RoleGuard';
import NotificationsPage from '../pages/shared/NotificationsPage';

import TechDashboard from '../pages/tech/TechDashboard';
import ReceivedMaterials from '../pages/tech/ReceivedMaterials';
import ProcessBatch from '../pages/tech/ProcessBatch';
import EncryptionHistory from '../pages/tech/EncryptionHistory';
import EncryptionDetail from '../pages/tech/EncryptionDetail';
import TechStatistics from '../pages/tech/TechStatistics';

function TechRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <RoleGuard allowedRole="tech">
            <RoleLayout role="tech" />
          </RoleGuard>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<TechDashboard />} />
        <Route path="received-materials" element={<ReceivedMaterials />} />
        <Route path="process/:batchId" element={<ProcessBatch />} />
        <Route path="encryption-history" element={<EncryptionHistory />} />
        <Route path="history/:id" element={<EncryptionDetail />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="statistics" element={<TechStatistics />} />
      </Route>
    </Routes>
  );
}

export default TechRoutes;