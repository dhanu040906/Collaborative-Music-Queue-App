import api from './client';

export const createRoom  = (data)     => api.post('/api/rooms', data).then(r => r.data);
export const getRoomByCode = (code)   => api.get(`/api/rooms/code/${code}`).then(r => r.data);
export const getRoomById = (id)       => api.get(`/api/rooms/${id}`).then(r => r.data);
export const deleteRoom  = (id)       => api.delete(`/api/rooms/${id}`).then(r => r.data);
