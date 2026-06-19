import api from './client';

export const getQueue   = (roomId)            => api.get(`/api/rooms/${roomId}/queue`).then(r => r.data);
export const addSong    = (roomId, song)       => api.post(`/api/rooms/${roomId}/queue`, song).then(r => r.data);
export const removeSong = (roomId, itemId)     => api.delete(`/api/rooms/${roomId}/queue/${itemId}`).then(r => r.data);
export const voteSong   = (roomId, itemId, v)  => api.patch(`/api/rooms/${roomId}/queue/${itemId}/vote`, { value: v }).then(r => r.data);
