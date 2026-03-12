import api from './axios';

export const createReview = (reviewBody, id) =>
  api.post('/api/v1/reviews', { reviewBody, id });

export const deleteReview = (reviewId, tutorialId) =>
  api.delete(`/api/v1/reviews/${reviewId}?tutorialId=${tutorialId}`);
