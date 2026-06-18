import React from 'react';
import { Route } from 'react-router-dom';
import RoleRoute from './RoleRoute';
import PurchaseDashboard from '../pages/purchase/PurchaseDashboard';
import VendorRequests from '../pages/purchase/VendorRequests';
import VendorDetails from '../pages/purchase/VendorDetails';
import MaterialReview from '../pages/purchase/MaterialReview';
import ApprovedMaterials from '../pages/purchase/ApprovedMaterials';
import RejectedMaterials from '../pages/purchase/RejectedMaterials';

export const purchaseRoutes = [
  <Route key="p1" path="/purchase/dashboard" element={<RoleRoute allowedRoles={['purchase']}><PurchaseDashboard /></RoleRoute>} />,
  <Route key="p2" path="/purchase/vendor-requests" element={<RoleRoute allowedRoles={['purchase']}><VendorRequests /></RoleRoute>} />,
  <Route key="p3" path="/purchase/vendor/:vendorId" element={<RoleRoute allowedRoles={['purchase']}><VendorDetails /></RoleRoute>} />,
  <Route key="p4" path="/purchase/materials" element={<RoleRoute allowedRoles={['purchase']}><MaterialReview /></RoleRoute>} />,
  <Route key="p5" path="/purchase/approved-materials" element={<RoleRoute allowedRoles={['purchase']}><ApprovedMaterials /></RoleRoute>} />,
  <Route key="p6" path="/purchase/rejected-materials" element={<RoleRoute allowedRoles={['purchase']}><RejectedMaterials /></RoleRoute>} />,
];