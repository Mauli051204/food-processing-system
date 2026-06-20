import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RoleLayout from '../layouts/RoleLayout';
import RoleGuard from '../components/admin/RoleGuard';
import NotificationsPage from '../pages/shared/NotificationsPage';

import PurchaseDashboard from '../pages/purchase/PurchaseDashboard';
import VendorRequests from '../pages/purchase/VendorRequests';
import VendorDetail from '../pages/purchase/VendorDetails';
import MaterialReview from '../pages/purchase/MaterialReview';
import ApprovedMaterials from '../pages/purchase/ApprovedMaterials';
import RejectedMaterials from '../pages/purchase/RejectedMaterials';
import PurchaseStatistics from '../pages/purchase/PurchaseStatistics';

function PurchaseRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <RoleGuard allowedRole="purchase">
            <RoleLayout role="purchase" />
          </RoleGuard>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<PurchaseDashboard />} />
        <Route path="vendor-requests" element={<VendorRequests />} />
        <Route path="vendor/:vendorId" element={<VendorDetail />} />
        <Route path="material-review" element={<MaterialReview />} />
        <Route path="approved-materials" element={<ApprovedMaterials />} />
        <Route path="rejected-materials" element={<RejectedMaterials />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="statistics" element={<PurchaseStatistics />} />
      </Route>
    </Routes>
  );
}

export default PurchaseRoutes;