import api from './api';

export const getNotifications = (params) => api.get('/notifications/', { params });
export const getUnreadCount = () => api.get('/notifications/unread-count/');
export const getLatestNotifications = () => api.get('/notifications/latest/');
export const markNotificationRead = (id) => api.post(`/notifications/${id}/read/`);
export const markAllNotificationsRead = () => api.post('/notifications/mark-all-read/');
export const deleteNotification = (id) => api.delete(`/notifications/${id}/`);
export const deleteAllReadNotifications = () => api.delete('/notifications/delete-all-read/');