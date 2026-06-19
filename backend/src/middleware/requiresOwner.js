const Room = require('../models/Room');

async function requiresOwner(req, res, next) {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the room owner can do this' });
    }
    req.room = room;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = requiresOwner;
