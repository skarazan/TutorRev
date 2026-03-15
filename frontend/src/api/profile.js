import api from './axios';

export const changeUsername = (newUsername) =>
  api.put('/api/v1/auth/profile/username', { newUsername });

export const requestPasswordChange = () =>
  api.post('/api/v1/auth/profile/request-password-change');

export const changePassword = (code, newPassword) =>
  api.put('/api/v1/auth/profile/password', { code, newPassword });

export const getUserReviews = () =>
  api.get('/api/v1/reviews/user');
