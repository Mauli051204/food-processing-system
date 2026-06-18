import axiosInstance from './axiosInstance';

export const getProductionDashboard = () => axiosInstance.get('/production/dashboard/');
export const getAvailableEncryptedFiles = (params) => axiosInstance.get('/production/encrypted-files/', { params });
export const requestKey = (encryptedFileId) => axiosInstance.post(`/production/request-key/${encryptedFileId}/`);
export const getKeyRequests = () => axiosInstance.get('/production/key-requests/');
export const decryptBatch = (encryptedFileId) => axiosInstance.post(`/production/decrypt/${encryptedFileId}/`);
export const downloadFile = (encryptedFileId) => axiosInstance.get(`/production/download/${encryptedFileId}/`, { responseType: 'blob' });
export const getDownloadHistory = (params) => axiosInstance.get('/production/download-history/', { params });
export const getProductionHistory = () => axiosInstance.get('/production/history/');