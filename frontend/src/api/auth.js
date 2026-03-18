import api from './axios';

export const register = (username, email, password) =>
  api.post('/api/v1/auth/register', { username, email, password });

export const login = (username, password) =>
  api.post('/api/v1/auth/login', { username, password });

export const logout = () =>
  api.post('/api/v1/auth/logout');

export const getMe = () =>
  api.get('/api/v1/auth/me');

export const verifyCode = (email, code) =>
  api.post('/api/v1/auth/verify-code', { email, code });

export const resendCode = (email) =>
  api.post('/api/v1/auth/resend-code', { email });

export const forgotPassword = (email) =>
  api.post('/api/v1/auth/forgot-password', { email });

export const resetPassword = (email, code, newPassword) =>
  api.post('/api/v1/auth/reset-password', { email, code, newPassword });
