const mongoose = require('mongoose');

// Votes are embedded directly on each queue item for fast access
const voteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  value:  { type: Number, enum: [-1, 1], required: true },
}, { _id: false });

const queueItemSchema = new mongoose.Schema({
  roomId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
  addedBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  spotifyTrackId: { type: String, required: true },
  title:          { type: String, required: true },
  artist:         { type: String, required: true },
  albumArt:       { type: String, default: '' },
  durationMs:     { type: Number, default: 0 },
  voteCount:      { type: Number, default: 0, index: true },
  votes:          [voteSchema],
}, { timestamps: true });

module.exports = mongoose.model('QueueItem', queueItemSchema);
