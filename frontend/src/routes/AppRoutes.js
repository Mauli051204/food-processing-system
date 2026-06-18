import React from 'react';
import { Routes, Route } from 'react-router-dom';
import VendorRegistration from '../pages/vendor/VendorRegistration';
import VendorDashboard from '../pages/vendor/VendorDashboard';
import VendorUpload from '../pages/vendor/VendorUpload';
import VendorHistory from '../pages/vendor/VendorHistory';
import VendorMaterials from '../pages/vendor/VendorMaterials';
import RoleRoute from './RoleRoute';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/vendor/register" element={<VendorRegistration />} />
      <Route path="/vendor/dashboard" element={<RoleRoute allowedRoles={['vendor']}><VendorDashboard /></RoleRoute>} />
      <Route path="/vendor/upload" element={<RoleRoute allowedRoles={['vendor']}><VendorUpload /></RoleRoute>} />
      <Route path="/vendor/history" element={<RoleRoute allowedRoles={['vendor']}><VendorHistory /></RoleRoute>} />
      <Route path="/vendor/materials" element={<RoleRoute allowedRoles={['vendor']}><VendorMaterials /></RoleRoute>} />
    </Routes>
  );
}

export default AppRoutes;