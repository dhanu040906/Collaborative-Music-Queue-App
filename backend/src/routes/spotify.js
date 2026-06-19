const router = require('express').Router();
const { searchTracks } = require('../controllers/spotifyController');
const requireAuth = require('../middleware/auth');

router.get('/search', requireAuth, searchTracks);

module.exports = router;
