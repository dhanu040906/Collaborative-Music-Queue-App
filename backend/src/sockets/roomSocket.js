const jwt = require('jsonwebtoken');
const QueueItem = require('../models/QueueItem');
const Room = require('../models/Room');

// In-memory presence: roomId -> Map<socketId, { userId, displayName, avatarUrl }>
const roomMembers = new Map();

function getMembers(roomId) {
  return Array.from((roomMembers.get(roomId) || new Map()).values());
}

function formatItem(item, currentUserId) {
  const myVote = item.votes?.find(v => v.userId.toString() === currentUserId?.toString());
  return {
    id: item._id,
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

async function getSortedQueue(roomId) {
  const items = await QueueItem.find({ roomId })
    .populate('addedBy', 'displayName avatarUrl')
    .sort({ voteCount: -1, createdAt: 1 });
  return items;
}

function initSocket(io) {
  const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

  // Auth middleware on handshake
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Unauthorized'));
    try {
      socket.data.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const { userId } = socket.data.user;
    console.log(`🔌 Socket connected: ${socket.id} (user ${userId})`);

    // --- join_room ---
    socket.on('join_room', async ({ roomId, displayName, avatarUrl }) => {
      socket.join(roomId);

      if (!roomMembers.has(roomId)) roomMembers.set(roomId, new Map());
      roomMembers.get(roomId).set(socket.id, { userId, displayName, avatarUrl });

      const members = getMembers(roomId);
      io.to(roomId).emit('members_updated', members);

      // Send current queue state to the joining user
      const queue = await getSortedQueue(roomId);
      socket.emit('room_state', {
        queue: queue.map(i => formatItem(i, userId)),
        members,
      });

      socket.to(roomId).emit('member_joined', { userId, displayName, avatarUrl });
    });

    // --- add_song ---
    socket.on('add_song', async ({ roomId, song }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room?.isActive) return;

        const exists = await QueueItem.exists({ roomId, spotifyTrackId: song.spotifyTrackId });
        if (exists) {
          return socket.emit('error', { message: 'Song already in queue' });
        }

        const item = await QueueItem.create({
          roomId,
          addedBy: userId,
          spotifyTrackId: song.spotifyTrackId,
          title: song.title,
          artist: song.artist,
          albumArt: song.albumArt,
          durationMs: song.durationMs,
        });
        await item.populate('addedBy', 'displayName avatarUrl');

        io.to(roomId).emit('song_added', formatItem(item, userId));

        // Emit full sorted queue so all clients stay in sync
        const queue = await getSortedQueue(roomId);
        io.to(roomId).emit('queue_reordered', queue.map(i => formatItem(i, userId)));
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // --- vote ---
    socket.on('vote', async ({ roomId, itemId, value }) => {
      try {
        if (![1, -1].includes(value)) return;

        const item = await QueueItem.findOne({ _id: itemId, roomId });
        if (!item) return;

        const existingIdx = item.votes.findIndex(v => v.userId.toString() === userId.toString());
        if (existingIdx !== -1) {
          if (item.votes[existingIdx].value === value) {
            item.votes.splice(existingIdx, 1); // toggle off
          } else {
            item.votes[existingIdx].value = value;
          }
        } else {
          item.votes.push({ userId, value });
        }

        item.voteCount = item.votes.reduce((s, v) => s + v.value, 0);
        await item.save();

        // Broadcast full reordered queue to everyone in room
        const queue = await getSortedQueue(roomId);
        io.to(roomId).emit('queue_reordered', queue.map(i => formatItem(i, userId)));
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // --- remove_song (owner or adder) ---
    socket.on('remove_song', async ({ roomId, itemId }) => {
      try {
        const [item, room] = await Promise.all([
          QueueItem.findOne({ _id: itemId, roomId }),
          Room.findById(roomId),
        ]);
        if (!item || !room) return;

        const isOwner = room.ownerId.toString() === userId.toString();
        const isAdder = item.addedBy.toString() === userId.toString();
        if (!isOwner && !isAdder) return;

        await item.deleteOne();

        const queue = await getSortedQueue(roomId);
        io.to(roomId).emit('song_removed', { itemId });
        io.to(roomId).emit('queue_reordered', queue.map(i => formatItem(i, userId)));
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // --- leave_room ---
    socket.on('leave_room', ({ roomId }) => {
      cleanupMember(socket, roomId, io);
    });

    // --- disconnect ---
    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
      for (const [roomId] of roomMembers) {
        if (roomMembers.get(roomId)?.has(socket.id)) {
          cleanupMember(socket, roomId, io);
          break;
        }
      }
    });
  });
}

function cleanupMember(socket, roomId, io) {
  const members = roomMembers.get(roomId);
  if (!members) return;
  const member = members.get(socket.id);
  members.delete(socket.id);
  if (members.size === 0) roomMembers.delete(roomId);
  socket.leave(roomId);
  if (member) {
    io.to(roomId).emit('member_left', { userId: member.userId });
    io.to(roomId).emit('members_updated', getMembers(roomId));
  }
}

module.exports = { initSocket };
