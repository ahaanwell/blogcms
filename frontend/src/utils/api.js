import axios from 'axios';

// Point directly to backend URL — no proxy needed
// In development: http://localhost:5000/api
// In production: set REACT_APP_API_URL=https://your-backend.com/api
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — but NOT on the login route itself
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLoginRoute = err.config?.url?.includes('/auth/login');
    if (err.response?.status === 401 && !isLoginRoute) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
