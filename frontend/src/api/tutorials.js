import api from './axios';

export const getAllTutorials = () =>
  api.get('/api/v1/tutorials');

export const getTutorial = (id) =>
  api.get(`/api/v1/tutorials/${id}`);

export const createTutorial = (url, reviewBody, level, rating) =>
  api.post('/api/v1/tutorials', { url, reviewBody, level, rating: String(rating) });

export const deleteTutorial = (id) =>
  api.delete(`/api/v1/tutorials/${id}`);
