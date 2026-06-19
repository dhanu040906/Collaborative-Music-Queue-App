const mongoose = require('mongoose');

const VIBES = ['chill', 'hype', 'study', 'party', 'road-trip'];

const roomSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true, maxlength: 60 },
  joinCode: { type: String, required: true, unique: true, uppercase: true },
  ownerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true },
  vibe:     { type: String, enum: VIBES, default: 'chill' },
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
