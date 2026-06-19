/**
 * transferController.js
 *
 * REST handlers for the cross-platform playlist transfer feature.
 */

const transferService = require('../services/transferService');
const { z } = require('zod');

const transferSchema = z.object({
  sourcePlatform:   z.enum(['spotify', 'youtube']),
  sourcePlaylistId: z.string().min(1),
  destPlatform:     z.enum(['spotify', 'youtube']),
  destPlaylistName: z.string().min(1).max(150),
});

// GET /api/transfer/playlists?platform=spotify|youtube
exports.listPlaylists = async (req, res, next) => {
  try {
    const { platform } = req.query;
    if (!['spotify', 'youtube'].includes(platform)) {
      return res.status(400).json({ error: 'platform must be "spotify" or "youtube"' });
    }
    if (!req.user.hasPlatform(platform)) {
      return res.status(403).json({
        error: `${platform} is not connected. Visit /profile to connect.`,
        code:  'PLATFORM_NOT_CONNECTED',
      });
    }
    const playlists = await transferService.getUserPlaylists(req.user, platform);
    res.json({ platform, playlists });
  } catch (err) { next(err); }
};

// GET /api/transfer/playlists/:id/tracks?platform=spotify|youtube
exports.previewTracks = async (req, res, next) => {
  try {
    const { platform } = req.query;
    const { id }       = req.params;
    if (!['spotify', 'youtube'].includes(platform)) {
      return res.status(400).json({ error: 'platform must be "spotify" or "youtube"' });
    }
    if (!req.user.hasPlatform(platform)) {
      return res.status(403).json({ error: `${platform} is not connected`, code: 'PLATFORM_NOT_CONNECTED' });
    }
    const tracks = await transferService.getPlaylistTracks(req.user, platform, id);
    res.json({ platform, playlistId: id, tracks, count: tracks.length });
  } catch (err) { next(err); }
};

// POST /api/transfer
exports.startTransfer = async (req, res, next) => {
  try {
    const parsed = transferSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
    }

    const { sourcePlatform, sourcePlaylistId, destPlatform, destPlaylistName } = parsed.data;

    // Check both platforms are connected
    for (const p of [sourcePlatform, destPlatform]) {
      if (!req.user.hasPlatform(p)) {
        return res.status(403).json({
          error: `${p} is not connected. Visit /profile to connect.`,
          code:  'PLATFORM_NOT_CONNECTED',
        });
      }
    }

    const result = await transferService.transferPlaylist(
      req.user,
      sourcePlatform,
      sourcePlaylistId,
      destPlatform,
      destPlaylistName
    );

    res.json({
      success:      true,
      transferred:  result.transferred,
      failed:       result.failed,
      totalTracks:  result.totalTracks,
      failedTracks: result.failedTracks,
      playlistUrl:  result.playlistUrl,
      destPlatform,
    });
  } catch (err) { next(err); }
};
