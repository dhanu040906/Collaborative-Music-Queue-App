import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export function useRoomSocket(roomId) {
  const { socket } = useSocket();
  const { user }   = useAuth();
  const [queue,   setQueue]   = useState([]);
  const [members, setMembers] = useState([]);
  const joined = useRef(false);

  useEffect(() => {
    if (!socket || !roomId || !user || joined.current) return;

    socket.emit('join_room', {
      roomId,
      displayName: user.displayName,
      avatarUrl:   user.avatarUrl,
    });
    joined.current = true;

    socket.on('room_state',      ({ queue: q, members: m }) => { setQueue(q); setMembers(m); });
    socket.on('song_added',      () => {});                      // queue_reordered handles it
    socket.on('queue_reordered', (q) => setQueue(q));
    socket.on('members_updated', (m) => setMembers(m));
    socket.on('song_removed',    () => {});

    return () => {
      socket.off('room_state');
      socket.off('song_added');
      socket.off('queue_reordered');
      socket.off('members_updated');
      socket.off('song_removed');
      socket.emit('leave_room', { roomId });
      joined.current = false;
    };
  }, [socket, roomId, user]);

  const addSong = useCallback((song) => {
    socket?.emit('add_song', { roomId, song });
  }, [socket, roomId]);

  const vote = useCallback((itemId, value) => {
    socket?.emit('vote', { roomId, itemId, value });
  }, [socket, roomId]);

  const removeSong = useCallback((itemId) => {
    socket?.emit('remove_song', { roomId, itemId });
  }, [socket, roomId]);

  return { queue, members, addSong, vote, removeSong };
}
