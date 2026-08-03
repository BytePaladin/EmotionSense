import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(
  (config) => {
    const isAdminRoute = window.location.pathname.startsWith('/admin') || config.url?.includes('/admin/');
    const token = isAdminRoute
      ? (localStorage.getItem('emotionsense_admin_token') || localStorage.getItem('emotionsense_token'))
      : localStorage.getItem('emotionsense_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (window.location.pathname.startsWith('/admin')) {
        localStorage.removeItem('emotionsense_admin_token');
        localStorage.removeItem('emotionsense_admin');
        if (window.location.pathname !== '/admin/login') {
          window.location.href = '/admin/login';
        }
      } else {
        localStorage.removeItem('emotionsense_token');
        localStorage.removeItem('emotionsense_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

