const QueueItem = require('../models/QueueItem');
const Room = require('../models/Room');

function formatItem(item, currentUserId) {
  const myVote = item.votes.find(v => v.userId.toString() === currentUserId?.toString());
  return {
    id: item._id,
    roomId: item.roomId,
    spotifyTrackId: item.spotifyTrackId,
    title: item.title,
    artist: item.artist,
    albumArt: item.albumArt,
    durationMs: item.durationMs,
    voteCount: item.voteCount,
    myVote: myVote?.value ?? 0,
    addedBy: {
      id: item.addedBy?._id || item.addedBy,
      displayName: item.addedBy?.displayName,
      avatarUrl: item.addedBy?.avatarUrl,
    },
    addedAt: item.createdAt,
  };
}

// GET /api/rooms/:id/queue
exports.getQueue = async (req, res, next) => {
  try {
    const items = await QueueItem.find({ roomId: req.params.id })
      .populate('addedBy', 'displayName avatarUrl')
      .sort({ voteCount: -1, createdAt: 1 });
    res.json(items.map(i => formatItem(i, req.user._id)));
  } catch (err) { next(err); }
};

// POST /api/rooms/:id/queue
exports.addSong = async (req, res, next) => {
  try {
    const { spotifyTrackId, title, artist, albumArt, durationMs } = req.body;
    const roomId = req.params.id;

    const room = await Room.findById(roomId);
    if (!room?.isActive) return res.status(404).json({ error: 'Room not found' });

    const exists = await QueueItem.exists({ roomId, spotifyTrackId });
    if (exists) return res.status(409).json({ error: 'Song already in queue' });

    const item = await QueueItem.create({
      roomId, addedBy: req.user._id,
      spotifyTrackId, title, artist, albumArt, durationMs,
    });
    await item.populate('addedBy', 'displayName avatarUrl');
    res.status(201).json(formatItem(item, req.user._id));
  } catch (err) { next(err); }
};

// DELETE /api/rooms/:id/queue/:itemId
exports.removeSong = async (req, res, next) => {
  try {
    const item = await QueueItem.findOne({ _id: req.params.itemId, roomId: req.params.id });
    if (!item) return res.status(404).json({ error: 'Song not found' });

    const room = await Room.findById(req.params.id);
    const isOwner = room?.ownerId.toString() === req.user._id.toString();
    const isAdder = item.addedBy.toString() === req.user._id.toString();
    if (!isOwner && !isAdder) return res.status(403).json({ error: 'Not allowed' });

    await item.deleteOne();
    res.json({ message: 'Song removed', itemId: req.params.itemId });
  } catch (err) { next(err); }
};

// PATCH /api/rooms/:id/queue/:itemId/vote
exports.vote = async (req, res, next) => {
  try {
    const { value } = req.body; // +1 or -1
    if (![1, -1].includes(value)) return res.status(400).json({ error: 'value must be 1 or -1' });

    const item = await QueueItem.findOne({ _id: req.params.itemId, roomId: req.params.id });
    if (!item) return res.status(404).json({ error: 'Song not found' });

    const userId = req.user._id;
    const existingIdx = item.votes.findIndex(v => v.userId.toString() === userId.toString());

    if (existingIdx !== -1) {
      const current = item.votes[existingIdx].value;
      if (current === value) {
        // Toggle off — remove vote
        item.votes.splice(existingIdx, 1);
      } else {
        // Change vote direction
        item.votes[existingIdx].value = value;
      }
    } else {
      item.votes.push({ userId, value });
    }

    // Recalculate voteCount from embedded votes
    item.voteCount = item.votes.reduce((sum, v) => sum + v.value, 0);
    await item.save();
    await item.populate('addedBy', 'displayName avatarUrl');

    res.json(formatItem(item, userId));
  } catch (err) { next(err); }
};
