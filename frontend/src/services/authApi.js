import api from './api';

export const login = (email, password) => api.post('/auth/login/', { email, password });
export const logout = () => api.post('/auth/logout/');
export const getCurrentUser = () => api.get('/auth/me/');

const REGISTER_ENDPOINTS = {
  vendor: '/vendor/register/',
  purchase: '/purchase/register/',
  tech: '/tech/register/',
  production: '/production/register/',
};

export const registerUser = (role, data) => api.post(REGISTER_ENDPOINTS[role], data);