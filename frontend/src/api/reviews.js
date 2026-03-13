import api from './axios';

export const createReview = (reviewBody, id, rating) =>
  api.post('/api/v1/reviews', { reviewBody, id, rating: String(rating) });

export const deleteReview = (reviewId, tutorialId) =>
  api.delete(`/api/v1/reviews/${reviewId}?tutorialId=${tutorialId}`);
