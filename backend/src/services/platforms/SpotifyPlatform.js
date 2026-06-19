/**
 * SpotifyPlatform — adapter for the Spotify Web API.
 * Implements the standard platform interface used by transferService.js:
 *   getUserPlaylists(user)
 *   getPlaylistTracks(user, playlistId)
 *   searchTrack(user, title, artist)
 *   createPlaylist(user, name)
 *   addTracksToPlaylist(user, playlistId, trackIds[])
 *   refreshTokenIfNeeded(user)
 */

const axios = require('axios');
const User  = require('../../models/User');

const SPOTIFY_API = 'https://api.spotify.com/v1';
const TOKEN_URL   = 'https://accounts.spotify.com/api/token';

// ─── Token Helpers ────────────────────────────────────────────────────────────

async function getValidToken(user) {
  const p = user.connectedPlatforms?.spotify;
  if (!p?.accessToken) throw Object.assign(new Error('Spotify not connected'), { status: 400 });

  if (p.expiresAt && new Date() >= new Date(p.expiresAt)) {
    return refreshToken(user);
  }
  return p.accessToken;
}

async function refreshToken(user) {
  const p = user.connectedPlatforms.spotify;
  const params = new URLSearchParams({
    grant_type:    'refresh_token',
    refresh_token: p.refreshToken,
  });
  const creds = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64');

  const { data } = await axios.post(TOKEN_URL, params.toString(), {
    headers: {
      Authorization:  `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  const expiresAt = new Date(Date.now() + data.expires_in * 1000);
  await User.findByIdAndUpdate(user._id, {
    'connectedPlatforms.spotify.accessToken': data.access_token,
    'connectedPlatforms.spotify.expiresAt':   expiresAt,
  });

  return data.access_token;
}

// ─── Spotify Client Factory ────────────────────────────────────────────────────

async function spotifyClient(user) {
  const token = await getValidToken(user);
  return axios.create({
    baseURL: SPOTIFY_API,
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ─── Platform Interface ────────────────────────────────────────────────────────

/**
 * Returns the user's Spotify playlists.
 * @returns {Array<{ id, name, trackCount, thumbnailUrl, platform }>}
 */
async function getUserPlaylists(user) {
  const client = await spotifyClient(user);
  const items  = [];
  let   url    = '/me/playlists?limit=50';

  while (url) {
    const { data } = await client.get(url.replace(SPOTIFY_API, ''));
    items.push(...data.items);
    // Handle absolute next URLs
    url = data.next ? data.next.replace(SPOTIFY_API, '') : null;
  }

  return items.map(pl => ({
    id:           pl.id,
    name:         pl.name,
    trackCount:   pl.tracks?.total ?? 0,
    thumbnailUrl: pl.images?.[0]?.url || null,
    platform:     'spotify',
  }));
}

/**
 * Returns all tracks from a Spotify playlist.
 * @returns {Array<{ title, artist, durationMs, thumbnailUrl, platformTrackId }>}
 */
async function getPlaylistTracks(user, playlistId) {
  const client = await spotifyClient(user);
  const tracks = [];
  let   url    = `/playlists/${playlistId}/tracks?limit=100&fields=next,items(track(id,name,duration_ms,artists,album(images)))`;

  while (url) {
    const { data } = await client.get(url.replace(SPOTIFY_API, ''));
    for (const { track } of data.items) {
      if (!track || track.is_local) continue; // skip null / local files
      tracks.push({
        platformTrackId: track.id,
        title:           track.name,
        artist:          track.artists.map(a => a.name).join(', '),
        durationMs:      track.duration_ms,
        thumbnailUrl:    track.album.images?.[0]?.url || null,
      });
    }
    url = data.next ? data.next.replace(SPOTIFY_API, '') : null;
  }

  return tracks;
}

/**
 * Searches Spotify for a track by title + artist.
 * @returns {{ platformTrackId, title, artist, url } | null}
 */
async function searchTrack(user, title, artist) {
  try {
    const client = await spotifyClient(user);
    const q      = encodeURIComponent(`track:${title} artist:${artist}`);
    const { data } = await client.get(`/search?q=${q}&type=track&limit=1`);
    const track    = data.tracks?.items?.[0];
    if (!track) return null;
    return {
      platformTrackId: `spotify:track:${track.id}`,
      title:           track.name,
      artist:          track.artists.map(a => a.name).join(', '),
      url:             track.external_urls.spotify,
    };
  } catch {
    return null;
  }
}

/**
 * Creates a new Spotify playlist for the user.
 * @returns {{ platformPlaylistId, url }}
 */
async function createPlaylist(user, name) {
  const client = await spotifyClient(user);
  const spotifyUserId = user.connectedPlatforms.spotify.platformUserId;
  const { data } = await client.post(`/users/${spotifyUserId}/playlists`, {
    name,
    public: false,
    description: 'Created by MusicCollab Transfer',
  });
  return {
    platformPlaylistId: data.id,
    url:                data.external_urls.spotify,
  };
}

/**
 * Adds tracks (as Spotify URIs) to a playlist. Max 100 per request.
 * @param {string[]} trackIds — array of "spotify:track:{id}" URIs
 * @returns {{ added: number, failed: number }}
 */
async function addTracksToPlaylist(user, playlistId, trackIds) {
  const client = await spotifyClient(user);
  let added = 0, failed = 0;

  // Batch into chunks of 100
  for (let i = 0; i < trackIds.length; i += 100) {
    const chunk = trackIds.slice(i, i + 100);
    try {
      await client.post(`/playlists/${playlistId}/tracks`, { uris: chunk });
      added += chunk.length;
    } catch {
      failed += chunk.length;
    }
  }

  return { added, failed };
}

module.exports = {
  name: 'spotify',
  getUserPlaylists,
  getPlaylistTracks,
  searchTrack,
  createPlaylist,
  addTracksToPlaylist,
};
