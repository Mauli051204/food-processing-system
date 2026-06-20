import api from './api';

export const ensureCsrf = () => api.get('/auth/csrf/');