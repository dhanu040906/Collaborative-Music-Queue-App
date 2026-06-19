const router = require('express').Router();
const requireAuth = require('../middleware/auth');
const {
  listPlaylists,
  previewTracks,
  startTransfer,
} = require('../controllers/transferController');

// All transfer routes require authentication
router.use(requireAuth);

// GET  /api/transfer/playlists?platform=spotify|youtube
router.get('/playlists', listPlaylists);

// GET  /api/transfer/playlists/:id/tracks?platform=spotify|youtube
router.get('/playlists/:id/tracks', previewTracks);

// POST /api/transfer
router.post('/', startTransfer);

module.exports = router;
