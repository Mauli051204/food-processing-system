import axiosInstance from './axiosInstance';

export const getPurchaseDashboard = () => axiosInstance.get('/purchase/dashboard/');
export const getVendorRequests = (params) => axiosInstance.get('/purchase/vendor-requests/', { params });
export const getVendorDetail = (vendorId) => axiosInstance.get(`/purchase/vendor/${vendorId}/`);
export const getMaterials = (params) => axiosInstance.get('/purchase/materials/', { params });
export const editMaterial = (materialId, data) => axiosInstance.put(`/purchase/material/${materialId}/edit/`, data);
export const approveMaterial = (materialId, data) => axiosInstance.post(`/purchase/material/${materialId}/approve/`, data);
export const rejectMaterial = (materialId, reason) => axiosInstance.post(`/purchase/material/${materialId}/reject/`, { reason });
export const getApprovedMaterials = (params) => axiosInstance.get('/purchase/approved-materials/', { params });
export const getRejectedMaterials = (params) => axiosInstance.get('/purchase/rejected-materials/', { params });
export const sendToTech = (approvedMaterialIds) => axiosInstance.post('/purchase/send-to-tech/', { approved_material_ids: approvedMaterialIds });