import api from './api';

export const getAdminDashboard = () => api.get('/admin/dashboard/');

export const getUsers = (params) => api.get('/admin/users/', { params });
export const getUserDetail = (id) => api.get(`/admin/users/${id}/`);
export const approveUser = (id) => api.post(`/admin/users/${id}/approve/`);
export const rejectUser = (id, reason) => api.post(`/admin/users/${id}/reject/`, { reason });
export const activateUser = (id) => api.post(`/admin/users/${id}/activate/`);
export const deactivateUser = (id) => api.post(`/admin/users/${id}/deactivate/`);

export const getKeyRequests = (params) => api.get('/admin/key-requests/', { params });
export const approveKeyRequest = (id) => api.post(`/admin/key-request/${id}/approve/`);
export const rejectKeyRequest = (id, reason) => api.post(`/admin/key-request/${id}/reject/`, { reason });

export const getEncryptionHistory = (params) => api.get('/admin/encryption-history/', { params });
export const getDownloadHistory = (params) => api.get('/admin/download-history/', { params });

export const getAuditLogs = (params) => api.get('/admin/audit-logs/', { params });

export const getNotifications = (params) => api.get('/admin/notifications/', { params });
export const markNotificationRead = (id) => api.post(`/admin/notifications/${id}/read/`);

export const getReportTypes = () => api.get('/admin/reports/');
export const downloadReport = (type, exportFormat) =>
  api.get('/admin/reports/', {
    params: { type, export: exportFormat },
    responseType: 'blob',
  });

export const getSystemSettings = () => api.get('/admin/system-settings/');
export const updateSystemSettings = (data) => api.put('/admin/system-settings/', data);