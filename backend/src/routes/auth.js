const router = require('express').Router();
const {
  guestLogin,
  getMe,
  spotifyConnect,
  spotifyCallback,
  youtubeConnect,
  youtubeCallback,
  disconnectPlatform,
} = require('../controllers/authController');
const requireAuth = require('../middleware/auth');
const validate    = require('../middleware/validate');
const { z }       = require('zod');

const guestSchema = z.object({ displayName: z.string().max(40).optional() });

// Existing
router.post('/guest', validate(guestSchema), guestLogin);
router.get('/me', requireAuth, getMe);

// Spotify OAuth
router.get('/spotify',          spotifyConnect);
router.get('/spotify/callback', spotifyCallback);

// YouTube OAuth
router.get('/youtube',          youtubeConnect);
router.get('/youtube/callback', youtubeCallback);

// Disconnect a platform
router.delete('/disconnect/:platform', requireAuth, disconnectPlatform);

module.exports = router;

