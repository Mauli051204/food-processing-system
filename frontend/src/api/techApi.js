import axiosInstance from './axiosInstance';

export const getTechDashboard = () => axiosInstance.get('/tech/dashboard/');
export const getReceivedMaterials = (params) => axiosInstance.get('/tech/materials/', { params });
export const generateTxt = (batchId) => axiosInstance.post(`/tech/generate-txt/${batchId}/`);
export const encryptBatch = (batchId) => axiosInstance.post(`/tech/encrypt/${batchId}/`);
export const getEncryptionHistory = (params) => axiosInstance.get('/tech/history/', { params });
export const getEncryptionDetail = (id) => axiosInstance.get(`/tech/history/${id}/`);