import axiosInstance from './axiosInstance';

export const registerVendor = (data) => axiosInstance.post('/vendor/register/', data);
export const getVendorDashboard = () => axiosInstance.get('/vendor/dashboard/');
export const uploadMaterialFile = (formData) =>
  axiosInstance.post('/vendor/upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const getUploadHistory = () => axiosInstance.get('/vendor/uploads/');
export const getMaterials = (params) => axiosInstance.get('/vendor/materials/', { params });
export const sendToPurchase = (materialIds) =>
  axiosInstance.post('/vendor/send-to-purchase/', { material_ids: materialIds });
export const getVendorProfile = () => axiosInstance.get('/vendor/profile/');
export const updateVendorProfile = (data) => axiosInstance.put('/vendor/profile/', data);