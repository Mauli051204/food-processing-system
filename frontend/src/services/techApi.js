import api from './api';

export const getTechDashboard = () => api.get('/tech/dashboard/');
export const getEncryptionTrend = (days = 14) => api.get('/tech/encryption-trend/', { params: { days } });
export const getEncryptionStatusBreakdown = () => api.get('/tech/encryption-status-breakdown/');
export const getTechStatistics = () => api.get('/tech/statistics/');

export const getReceivedMaterials = (params) => api.get('/tech/materials/', { params });
export const generateTxt = (batchId) => api.post(`/tech/generate-txt/${batchId}/`);
export const encryptBatch = (batchId) => api.post(`/tech/encrypt/${batchId}/`);

export const getEncryptionHistory = (params) => api.get('/tech/history/', { params });
export const getEncryptionDetail = (id) => api.get(`/tech/history/${id}/`);