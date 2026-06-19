const Room = require('../models/Room');
const QueueItem = require('../models/QueueItem');

function generateJoinCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function formatRoom(room) {
  const owner = room.ownerId;
  return {
    id: room._id,
    name: room.name,
    joinCode: room.joinCode,
    vibe: room.vibe,
    ownerId: owner?._id || owner,
    ownerName: owner?.displayName,
    createdAt: room.createdAt,
  };
}

// POST /api/rooms
exports.createRoom = async (req, res, next) => {
  try {
    const { name, vibe } = req.body;
    let joinCode, attempts = 0;
    do {
      joinCode = generateJoinCode();
      if (++attempts > 10) throw new Error('Could not generate unique join code');
    } while (await Room.exists({ joinCode }));

    const room = await Room.create({
      name: name.trim(),
      joinCode,
      ownerId: req.user._id,
      vibe: vibe || 'chill',
    });
    await room.populate('ownerId', 'displayName avatarUrl');
    res.status(201).json(formatRoom(room));
  } catch (err) { next(err); }
};

// GET /api/rooms/code/:joinCode
exports.getRoomByJoinCode = async (req, res, next) => {
  try {
    const room = await Room.findOne({
      joinCode: req.params.joinCode.toUpperCase(),
      isActive: true,
    }).populate('ownerId', 'displayName avatarUrl');
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(formatRoom(room));
  } catch (err) { next(err); }
};

// GET /api/rooms/:id
exports.getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('ownerId', 'displayName avatarUrl');
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(formatRoom(room));
  } catch (err) { next(err); }
};

// DELETE /api/rooms/:id  (owner only)
exports.deleteRoom = async (req, res, next) => {
  try {
    await Room.findByIdAndUpdate(req.params.id, { isActive: false });
    await QueueItem.deleteMany({ roomId: req.params.id });
    res.json({ message: 'Room closed' });
  } catch (err) { next(err); }
};
