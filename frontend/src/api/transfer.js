import api from './client';

// List playlists from a connected platform
export const fetchPlaylists = (platform) =>
  api.get(`/api/transfer/playlists?platform=${platform}`).then(r => r.data);

// Preview tracks inside a playlist before transferring
export const fetchPlaylistTracks = (platform, playlistId) =>
  api.get(`/api/transfer/playlists/${playlistId}/tracks?platform=${platform}`).then(r => r.data);

// Trigger a transfer
export const startTransfer = (payload) =>
  api.post('/api/transfer', payload).then(r => r.data);

// Connect a platform (redirect flow — open in same window)
export const connectPlatform = (platform, token) => {
  window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/${platform}?token=${token}`;
};

// Disconnect a platform
export const disconnectPlatform = (platform) =>
  api.delete(`/auth/disconnect/${platform}`).then(r => r.data);
