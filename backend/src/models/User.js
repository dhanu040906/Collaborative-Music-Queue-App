const mongoose = require('mongoose');

// Sub-schema for a single platform connection
const platformTokenSchema = new mongoose.Schema({
  platformUserId: { type: String },
  accessToken:    { type: String },
  refreshToken:   { type: String },
  expiresAt:      { type: Date },
}, { _id: false });

const userSchema = new mongoose.Schema({
  displayName: { type: String, required: true, trim: true },
  avatarUrl:   { type: String, default: '' },
  isGuest:     { type: Boolean, default: true },
  email:       { type: String },

  /**
   * Multi-platform OAuth tokens.
   * Each key is a platform name ('spotify', 'youtube', etc.)
   * Values are { platformUserId, accessToken, refreshToken, expiresAt }
   */
  connectedPlatforms: {
    spotify: { type: platformTokenSchema, default: undefined },
    youtube: { type: platformTokenSchema, default: undefined },
  },
}, { timestamps: true });

/** Convenience getter — returns true if a given platform is connected */
userSchema.methods.hasPlatform = function(name) {
  return !!this.connectedPlatforms?.[name]?.accessToken;
};

/** Returns a safe public representation of connected platform statuses */
userSchema.methods.platformStatus = function() {
  const platforms = this.connectedPlatforms || {};
  return {
    spotify: !!platforms.spotify?.accessToken,
    youtube: !!platforms.youtube?.accessToken,
  };
};

module.exports = mongoose.model('User', userSchema);
