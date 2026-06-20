import api from './api';

export const getVendorDashboard = () => api.get('/vendor/dashboard/');
export const getUploadTrend = (days = 14) => api.get('/vendor/upload-trend/', { params: { days } });
export const getMaterialStatus = () => api.get('/vendor/material-status/');
export const uploadMaterialFile = (formData) => api.post('/vendor/upload/', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const getUploadHistory = () => api.get('/vendor/uploads/');
export const getMaterials = (params) => api.get('/vendor/materials/', { params });
export const sendToPurchase = (materialIds) => api.post('/vendor/send-to-purchase/', { material_ids: materialIds });
export const getVendorProfile = () => api.get('/vendor/profile/');
export const updateVendorProfile = (data) => api.put('/vendor/profile/', data);