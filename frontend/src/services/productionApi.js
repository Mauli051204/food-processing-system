import api from './api';

export const getProductionDashboard = () => api.get('/production/dashboard/');
export const getDownloadTrend = (days = 14) => api.get('/production/download-trend/', { params: { days } });
export const getKeyRequestStatusBreakdown = () => api.get('/production/key-request-status-breakdown/');
export const getProductionStatistics = () => api.get('/production/statistics/');

export const getAvailableEncryptedFiles = (params) => api.get('/production/encrypted-files/', { params });
export const requestKey = (encryptedFileId) => api.post(`/production/request-key/${encryptedFileId}/`);
export const getKeyRequests = () => api.get('/production/key-requests/');
export const decryptBatch = (encryptedFileId) => api.post(`/production/decrypt/${encryptedFileId}/`);
export const downloadFile = (encryptedFileId) => api.get(`/production/download/${encryptedFileId}/`, { responseType: 'blob' });
export const getDownloadHistory = (params) => api.get('/production/download-history/', { params });
export const getProductionHistory = () => api.get('/production/history/');