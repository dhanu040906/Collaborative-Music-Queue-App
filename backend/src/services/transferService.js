/**
 * transferService.js
 *
 * Orchestrates cross-platform playlist transfers.
 * Works entirely through the platform adapter interface so adding
 * a new platform (Deezer, Apple Music, etc.) only requires a new adapter.
 *
 * Transfer flow:
 *   1. Fetch all tracks from source playlist
 *   2. Search for each track on the destination platform
 *   3. Create a new playlist on the destination
 *   4. Add all matched tracks to the new playlist
 *   5. Return a detailed result: matched, failed, playlist URL
 */

const SpotifyPlatform = require('./platforms/SpotifyPlatform');
const YouTubePlatform = require('./platforms/YouTubePlatform');

const PLATFORMS = {
  spotify: SpotifyPlatform,
  youtube: YouTubePlatform,
};

/**
 * Get a platform adapter by name.
 * @param {'spotify'|'youtube'} name
 */
function getPlatform(name) {
  const platform = PLATFORMS[name];
  if (!platform) throw Object.assign(new Error(`Unknown platform: ${name}`), { status: 400 });
  return platform;
}

/**
 * Transfer a playlist from one platform to another.
 *
 * @param {object} user           — Mongoose User document (with connectedPlatforms)
 * @param {string} sourcePlatform — 'spotify' | 'youtube'
 * @param {string} sourcePlaylistId
 * @param {string} destPlatform   — 'spotify' | 'youtube'
 * @param {string} destPlaylistName
 *
 * @returns {{
 *   transferred: number,
 *   failed: number,
 *   failedTracks: Array<{ title, artist, reason }>,
 *   playlistUrl: string,
 *   totalTracks: number,
 * }}
 */
async function transferPlaylist(user, sourcePlatform, sourcePlaylistId, destPlatform, destPlaylistName) {
  if (sourcePlatform === destPlatform) {
    throw Object.assign(new Error('Source and destination platforms must differ'), { status: 400 });
  }

  const source = getPlatform(sourcePlatform);
  const dest   = getPlatform(destPlatform);

  // 1. Fetch all tracks from the source playlist
  const tracks = await source.getPlaylistTracks(user, sourcePlaylistId);
  if (!tracks.length) {
    throw Object.assign(new Error('Source playlist is empty or could not be read'), { status: 422 });
  }

  // 2. Search for each track on the destination platform (with concurrency limit)
  const CONCURRENCY = 5; // don't hammer APIs in parallel
  const matched     = []; // { platformTrackId, title, artist, url }
  const failed      = []; // { title, artist, reason }

  for (let i = 0; i < tracks.length; i += CONCURRENCY) {
    const batch = tracks.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (track) => {
        const hit = await dest.searchTrack(user, track.title, track.artist);
        if (hit) {
          return { matched: hit };
        } else {
          return { failed: { title: track.title, artist: track.artist, reason: 'Not found on destination' } };
        }
      })
    );
    for (const r of results) {
      if (r.matched) matched.push(r.matched);
      else           failed.push(r.failed);
    }
  }

  if (!matched.length) {
    return {
      transferred:  0,
      failed:       tracks.length,
      failedTracks: failed,
      playlistUrl:  null,
      totalTracks:  tracks.length,
    };
  }

  // 3. Create destination playlist
  const newPlaylist = await dest.createPlaylist(user, destPlaylistName);

  // 4. Add matched tracks (each platform adapter handles batching internally)
  const trackIds = matched.map(t => t.platformTrackId);
  const addResult = await dest.addTracksToPlaylist(user, newPlaylist.platformPlaylistId, trackIds);

  return {
    transferred:  addResult.added,
    failed:       failed.length + addResult.failed,
    failedTracks: failed,
    playlistUrl:  newPlaylist.url,
    totalTracks:  tracks.length,
  };
}

/**
 * Fetch playlists from a connected platform for a user.
 */
async function getUserPlaylists(user, platformName) {
  const platform = getPlatform(platformName);
  return platform.getUserPlaylists(user);
}

/**
 * Preview tracks in a playlist (before transfer).
 */
async function getPlaylistTracks(user, platformName, playlistId) {
  const platform = getPlatform(platformName);
  return platform.getPlaylistTracks(user, playlistId);
}

module.exports = {
  transferPlaylist,
  getUserPlaylists,
  getPlaylistTracks,
  SUPPORTED_PLATFORMS: Object.keys(PLATFORMS),
};
