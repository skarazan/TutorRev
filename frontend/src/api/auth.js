import api from './axios';

export const register = (username, email, password) =>
  api.post('/api/v1/auth/register', { username, email, password });

export const login = (username, password) =>
  api.post('/api/v1/auth/login', { username, password });

export const logout = () =>
  api.post('/api/v1/auth/logout');

export const getMe = () =>
  api.get('/api/v1/auth/me');
