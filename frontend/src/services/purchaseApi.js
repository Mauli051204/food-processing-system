import api from './api';

export const getPurchaseDashboard = () => api.get('/purchase/dashboard/');
export const getVendorApprovalTrend = (days = 14) => api.get('/purchase/vendor-approval-trend/', { params: { days } });
export const getMaterialApprovalBreakdown = () => api.get('/purchase/material-approval-breakdown/');
export const getReviewActivityTrend = (days = 14) => api.get('/purchase/review-activity-trend/', { params: { days } });

export const getVendorRequests = (params) => api.get('/purchase/vendor-requests/', { params });
export const getVendorDetail = (vendorId) => api.get(`/purchase/vendor/${vendorId}/`);

export const getMaterialReview = (params) => api.get('/purchase/materials/', { params });
export const editMaterial = (materialId, data) => api.put(`/purchase/material/${materialId}/edit/`, data);
export const approveMaterial = (materialId, data) => api.post(`/purchase/material/${materialId}/approve/`, data);
export const rejectMaterial = (materialId, reason) => api.post(`/purchase/material/${materialId}/reject/`, { reason });

export const getApprovedMaterials = (params) => api.get('/purchase/approved-materials/', { params });
export const getRejectedMaterials = (params) => api.get('/purchase/rejected-materials/', { params });
export const sendToTech = (approvedMaterialIds) => api.post('/purchase/send-to-tech/', { approved_material_ids: approvedMaterialIds });