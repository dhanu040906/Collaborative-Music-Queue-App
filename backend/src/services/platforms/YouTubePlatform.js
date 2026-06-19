/**
 * YouTubePlatform — adapter for the YouTube Data API v3 (used as YouTube Music).
 * Implements the same interface as SpotifyPlatform so transferService
 * doesn't care which platform it's talking to.
 *
 * NOTE: YouTube Music doesn't have its own API.
 * We use YouTube Data API v3 with videoCategoryId=10 (Music) for filtering.
 */

const { google } = require('googleapis');
const User       = require('../../models/User');

const youtube = google.youtube('v3');

// ─── OAuth2 Client Factory ────────────────────────────────────────────────────

function makeOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

async function getAuthClient(user) {
  const p = user.connectedPlatforms?.youtube;
  if (!p?.accessToken) throw Object.assign(new Error('YouTube not connected'), { status: 400 });

  const oauth2Client = makeOAuth2Client();
  oauth2Client.setCredentials({
    access_token:  p.accessToken,
    refresh_token: p.refreshToken,
    expiry_date:   p.expiresAt ? new Date(p.expiresAt).getTime() : undefined,
  });

  // googleapis auto-refreshes the token — hook into the event to persist it
  oauth2Client.on('tokens', async (tokens) => {
    const update = {};
    if (tokens.access_token) update['connectedPlatforms.youtube.accessToken'] = tokens.access_token;
    if (tokens.expiry_date)  update['connectedPlatforms.youtube.expiresAt']   = new Date(tokens.expiry_date);
    if (Object.keys(update).length) await User.findByIdAndUpdate(user._id, update);
  });

  return oauth2Client;
}

// ─── Platform Interface ────────────────────────────────────────────────────────

/**
 * Returns the user's YouTube playlists.
 * @returns {Array<{ id, name, trackCount, thumbnailUrl, platform }>}
 */
async function getUserPlaylists(user) {
  const auth  = await getAuthClient(user);
  const items = [];
  let pageToken = undefined;

  do {
    const { data } = await youtube.playlists.list({
      auth,
      part:       ['snippet', 'contentDetails'],
      mine:       true,
      maxResults: 50,
      pageToken,
    });
    items.push(...(data.items || []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return items.map(pl => ({
    id:           pl.id,
    name:         pl.snippet.title,
    trackCount:   pl.contentDetails?.itemCount ?? 0,
    thumbnailUrl: pl.snippet.thumbnails?.medium?.url || null,
    platform:     'youtube',
  }));
}

/**
 * Returns all items from a YouTube playlist.
 * @returns {Array<{ title, artist, durationMs, thumbnailUrl, platformTrackId }>}
 */
async function getPlaylistTracks(user, playlistId) {
  const auth   = await getAuthClient(user);
  const tracks = [];
  let pageToken = undefined;

  do {
    const { data } = await youtube.playlistItems.list({
      auth,
      part:       ['snippet'],
      playlistId,
      maxResults: 50,
      pageToken,
    });

    for (const item of (data.items || [])) {
      const sn = item.snippet;
      if (sn.resourceId.kind !== 'youtube#video') continue;

      // YouTube titles often contain "Artist - Title" format; attempt parse
      const rawTitle = sn.title;
      const dashIdx  = rawTitle.indexOf(' - ');
      const artist   = dashIdx > 0 ? rawTitle.substring(0, dashIdx).trim() : '';
      const title    = dashIdx > 0 ? rawTitle.substring(dashIdx + 3).trim() : rawTitle;

      tracks.push({
        platformTrackId: sn.resourceId.videoId,
        title,
        artist,
        durationMs:      null, // not returned by playlistItems; need separate videos.list call (skipped for perf)
        thumbnailUrl:    sn.thumbnails?.medium?.url || null,
      });
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  return tracks;
}

/**
 * Searches YouTube for a music video by title + artist.
 * @returns {{ platformTrackId, title, artist, url } | null}
 */
async function searchTrack(user, title, artist) {
  try {
    const auth  = await getAuthClient(user);
    const query = artist ? `${title} ${artist}` : title;

    const { data } = await youtube.search.list({
      auth,
      part:             ['snippet'],
      q:                query,
      type:             ['video'],
      videoCategoryId:  '10', // Music category
      maxResults:       1,
    });

    const item = data.items?.[0];
    if (!item) return null;

    return {
      platformTrackId: item.id.videoId,
      title:           item.snippet.title,
      artist:          item.snippet.channelTitle,
      url:             `https://www.youtube.com/watch?v=${item.id.videoId}`,
    };
  } catch {
    return null;
  }
}

/**
 * Creates a new private YouTube playlist.
 * @returns {{ platformPlaylistId, url }}
 */
async function createPlaylist(user, name) {
  const auth = await getAuthClient(user);
  const { data } = await youtube.playlists.insert({
    auth,
    part: ['snippet', 'status'],
    requestBody: {
      snippet: { title: name, description: 'Created by MusicCollab Transfer' },
      status:  { privacyStatus: 'private' },
    },
  });

  return {
    platformPlaylistId: data.id,
    url:                `https://www.youtube.com/playlist?list=${data.id}`,
  };
}

/**
 * Adds video IDs to a YouTube playlist. Max 50 per request (rate limit).
 * @param {string[]} trackIds — array of YouTube video IDs
 * @returns {{ added: number, failed: number }}
 */
async function addTracksToPlaylist(user, playlistId, trackIds) {
  const auth = await getAuthClient(user);
  let added = 0, failed = 0;

  // YouTube requires one insert per video (no batch insert endpoint)
  // Process with small delay to avoid quota exhaustion
  for (const videoId of trackIds) {
    try {
      await youtube.playlistItems.insert({
        auth,
        part: ['snippet'],
        requestBody: {
          snippet: {
            playlistId,
            resourceId: { kind: 'youtube#video', videoId },
          },
        },
      });
      added++;
      // Small delay to avoid hitting quota (50 units/insert, 10k/day quota)
      await new Promise(r => setTimeout(r, 200));
    } catch {
      failed++;
    }
  }

  return { added, failed };
}

module.exports = {
  name: 'youtube',
  makeOAuth2Client,
  getUserPlaylists,
  getPlaylistTracks,
  searchTrack,
  createPlaylist,
  addTracksToPlaylist,
};
