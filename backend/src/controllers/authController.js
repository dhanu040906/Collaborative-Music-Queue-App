const jwt     = require('jsonwebtoken');
const axios   = require('axios');
const User    = require('../models/User');
const { makeOAuth2Client } = require('../services/platforms/YouTubePlatform');

const JWT_SECRET   = process.env.JWT_SECRET || 'dev-secret';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

function issueJWT(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

function formatUser(user) {
  return {
    id:                 user._id,
    displayName:        user.displayName,
    avatarUrl:          user.avatarUrl,
    isGuest:            user.isGuest,
    email:              user.email,
    connectedPlatforms: user.platformStatus ? user.platformStatus() : {},
  };
}

// ─── Existing ─────────────────────────────────────────────────────────────────

// POST /auth/guest
exports.guestLogin = async (req, res, next) => {
  try {
    const raw = (req.body.displayName || '').trim();
    const displayName = raw || `Guest${Math.floor(Math.random() * 9000) + 1000}`;
    const seed = encodeURIComponent(displayName + Date.now());
    const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;

    const user  = await User.create({ displayName, avatarUrl, isGuest: true });
    const token = issueJWT(user._id);
    res.status(201).json({ token, user: formatUser(user) });
  } catch (err) { next(err); }
};

// GET /auth/me  (protected)
exports.getMe = (req, res) => res.json(formatUser(req.user));

// ─── Spotify OAuth ────────────────────────────────────────────────────────────

// GET /auth/spotify?token=<JWT>
exports.spotifyConnect = (req, res) => {
  const { token } = req.query;
  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     process.env.SPOTIFY_CLIENT_ID,
    redirect_uri:  process.env.SPOTIFY_REDIRECT_URI,
    scope: [
      'user-read-private',
      'user-read-email',
      'playlist-read-private',
      'playlist-modify-private',
      'playlist-modify-public',
    ].join(' '),
    state: token || '',
  });
  res.redirect(`https://accounts.spotify.com/authorize?${params}`);
};

// GET /auth/spotify/callback
exports.spotifyCallback = async (req, res, next) => {
  try {
    const { code, state: token, error } = req.query;
    if (error) return res.redirect(`${FRONTEND_URL}/profile?error=spotify_denied`);

    const creds = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString('base64');

    const { data: td } = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type:   'authorization_code',
        code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
      }).toString(),
      { headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { data: profile } = await axios.get('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${td.access_token}` },
    });

    const expiresAt = new Date(Date.now() + td.expires_in * 1000);
    const platformData = {
      platformUserId: profile.id,
      accessToken:    td.access_token,
      refreshToken:   td.refresh_token,
      expiresAt,
    };

    let user = null;
    if (token) {
      try {
        const payload = jwt.verify(token, JWT_SECRET);
        user = await User.findByIdAndUpdate(
          payload.userId,
          { isGuest: false, avatarUrl: profile.images?.[0]?.url || '', email: profile.email || '',
            'connectedPlatforms.spotify': platformData },
          { new: true }
        );
      } catch { /* fall through */ }
    }

    if (!user) {
      user = await User.findOneAndUpdate(
        { 'connectedPlatforms.spotify.platformUserId': profile.id },
        { displayName: profile.display_name || 'Spotify User',
          avatarUrl: profile.images?.[0]?.url || '', isGuest: false,
          email: profile.email || '', 'connectedPlatforms.spotify': platformData },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    res.redirect(`${FRONTEND_URL}/callback?token=${issueJWT(user._id)}&platform=spotify`);
  } catch (err) { next(err); }
};

// ─── YouTube OAuth ────────────────────────────────────────────────────────────

// GET /auth/youtube?token=<JWT>
exports.youtubeConnect = (req, res) => {
  const { token } = req.query;
  const oauth2Client = makeOAuth2Client();
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/youtube',
      'https://www.googleapis.com/auth/youtube.force-ssl',
    ],
    prompt: 'consent',
    state:  token || '',
  });
  res.redirect(url);
};

// GET /auth/youtube/callback
exports.youtubeCallback = async (req, res, next) => {
  try {
    const { code, state: token, error } = req.query;
    if (error) return res.redirect(`${FRONTEND_URL}/profile?error=youtube_denied`);

    const oauth2Client = makeOAuth2Client();
    const { tokens }   = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const { google } = require('googleapis');
    const oauth2     = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: profile } = await oauth2.userinfo.get();

    const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : undefined;
    const platformData = {
      platformUserId: profile.id,
      accessToken:    tokens.access_token,
      refreshToken:   tokens.refresh_token,
      expiresAt,
    };

    let user = null;
    if (token) {
      try {
        const payload = jwt.verify(token, JWT_SECRET);
        user = await User.findByIdAndUpdate(
          payload.userId,
          { 'connectedPlatforms.youtube': platformData },
          { new: true }
        );
      } catch { /* fall through */ }
    }

    if (!user) {
      user = await User.findOneAndUpdate(
        { 'connectedPlatforms.youtube.platformUserId': profile.id },
        { displayName: profile.name || 'YouTube User', avatarUrl: profile.picture || '',
          isGuest: false, email: profile.email || '', 'connectedPlatforms.youtube': platformData },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    res.redirect(`${FRONTEND_URL}/callback?token=${issueJWT(user._id)}&platform=youtube`);
  } catch (err) { next(err); }
};

// ─── Disconnect ───────────────────────────────────────────────────────────────

// DELETE /auth/disconnect/:platform
exports.disconnectPlatform = async (req, res, next) => {
  try {
    const { platform } = req.params;
    if (!['spotify', 'youtube'].includes(platform)) {
      return res.status(400).json({ error: 'Unknown platform' });
    }
    await User.findByIdAndUpdate(req.user._id, {
      $unset: { [`connectedPlatforms.${platform}`]: 1 },
    });
    res.json({ message: `${platform} disconnected` });
  } catch (err) { next(err); }
};
