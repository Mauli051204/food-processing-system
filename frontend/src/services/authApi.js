// C:\Mauli\GradTwin\Project\food-processing-system\frontend\src\services\authApi.js
import api from './api';

export const login = (email, password) => api.post('/auth/login/', { email, password });
export const logout = () => api.post('/auth/logout/');
export const getCurrentUser = () => api.get('/auth/me/');