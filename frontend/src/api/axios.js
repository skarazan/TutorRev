import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If backend returns 401, clear token and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      window.location.href = '/login';
    }
    // If banned, redirect to login with banned error
    if (error.response?.status === 403 &&
        error.response?.data?.error?.includes('banned')) {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      window.location.href = '/login?error=banned';
    }
    return Promise.reject(error);
  }
);

export default api;
