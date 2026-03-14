import api from './axios';

export const getAllDevNotes = () =>
  api.get('/api/v1/devnotes');

export const createDevNote = (content) =>
  api.post('/api/v1/devnotes', { content });

export const deleteDevNote = (noteId) =>
  api.delete(`/api/v1/devnotes/${noteId}`);
