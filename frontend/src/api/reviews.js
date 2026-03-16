import api from './axios';

export const createReview = (reviewBody, id, rating) =>
  api.post('/api/v1/reviews', { reviewBody, id, rating: String(rating) });

export const editReview = (reviewId, reviewBody, rating) =>
  api.put(`/api/v1/reviews/${reviewId}`, { reviewBody, rating: String(rating) });

export const deleteReview = (reviewId, tutorialId) =>
  api.delete(`/api/v1/reviews/${reviewId}?tutorialId=${tutorialId}`);

export const toggleLike = (reviewId) =>
  api.put(`/api/v1/reviews/${reviewId}/like`);

export const toggleDislike = (reviewId) =>
  api.put(`/api/v1/reviews/${reviewId}/dislike`);
