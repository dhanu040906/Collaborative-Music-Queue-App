const router = require('express').Router({ mergeParams: true });
const { getQueue, addSong, removeSong, vote } = require('../controllers/queueController');
const requireAuth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { z } = require('zod');

const addSongSchema = z.object({
  spotifyTrackId: z.string().min(1),
  title:          z.string().min(1),
  artist:         z.string().min(1),
  albumArt:       z.string().url().optional().or(z.literal('')),
  durationMs:     z.number().int().nonnegative().optional(),
});

const voteSchema = z.object({
  value: z.union([z.literal(1), z.literal(-1)]),
});

router.get('/:id/queue',                     requireAuth, getQueue);
router.post('/:id/queue',                    requireAuth, validate(addSongSchema), addSong);
router.delete('/:id/queue/:itemId',          requireAuth, removeSong);
router.patch('/:id/queue/:itemId/vote',      requireAuth, validate(voteSchema), vote);

module.exports = router;
