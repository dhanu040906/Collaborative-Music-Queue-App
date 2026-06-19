import api from './client';

export const searchTracks = (q) => api.get('/api/spotify/search', { params: { q } }).then(r => r.data);
