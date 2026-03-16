import api from './axios';

export const getAdminStats = () =>
  api.get('/api/v1/admin/stats');

export const getAllUsers = () =>
  api.get('/api/v1/admin/users');

export const getUserProfile = (username) =>
  api.get(`/api/v1/admin/users/${username}`);

export const banUser = (username) =>
  api.put(`/api/v1/admin/users/${username}/ban`);

export const unbanUser = (username) =>
  api.put(`/api/v1/admin/users/${username}/unban`);

export const sendHeartbeat = () =>
  api.post('/api/v1/auth/heartbeat');
