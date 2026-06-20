import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true,
});

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

api.interceptors.request.use((config) => {
  if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
    const csrfToken = getCookie('csrftoken');
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      window.dispatchEvent(new CustomEvent('auth:expired'));
    } else if (status === 403) {
      window.dispatchEvent(new CustomEvent('auth:forbidden', { detail: error.response.data }));
    } else if (status === 500) {
      window.dispatchEvent(new CustomEvent('app:server-error'));
    }

    return Promise.reject(error);
  }
);

export default api;