import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useRoomSocket } from '../hooks/useRoomSocket';
import { getRoomByCode } from '../api/rooms';
import Navbar from '../components/Navbar';
import SongSearch from '../components/SongSearch';
import QueueList from '../components/QueueList';
import MemberList from '../components/MemberList';
import NowPlaying from '../components/NowPlaying';

export default function RoomPage() {
  const { code }    = useParams();
  const navigate    = useNavigate();
  const { user, isLoggedIn, loading: authLoading } = useAuth();

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !isLoggedIn) navigate('/');
  }, [authLoading, isLoggedIn, navigate]);

  // Fetch room info
  const { data: room, isLoading: roomLoading, error: roomError } = useQuery({
    queryKey: ['room', code],
    queryFn:  () => getRoomByCode(code),
    enabled:  !!code && isLoggedIn,
    retry: 1,
  });

  // Real-time socket hook
  const { queue, members, addSong, vote, removeSong } = useRoomSocket(room?.id);

  const isOwner = room && user && room.ownerId === user.id;
  const nowPlaying = queue[0] || null;

  const handleAddSong = (track) => {
    addSong(track);
    toast.success(`"${track.title}" added to queue 🎵`);
  };

  const handleVote = (itemId, value) => {
    vote(itemId, value);
  };

  const handleRemove = (itemId) => {
    removeSong(itemId);
    toast.success('Song removed');
  };

  if (authLoading || roomLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <span style={{ fontSize: 32 }} className="spin">⟳</span>
          <div style={{ marginTop: 12 }}>Loading room…</div>
        </div>
      </div>
    );
  }

  if (roomError) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 48 }}>😕</div>
        <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>Room not found</div>
        <div style={{ color: 'var(--text-muted)' }}>The code <strong>{code}</strong> doesn't match any active room.</div>
        <button className="btn-primary" onClick={() => navigate('/')}>← Back to Home</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar room={room} />

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 300px', gap: 0, maxWidth: 1200, width: '100%', margin: '0 auto', padding: '24px 20px', alignItems: 'start' }}>

        {/* LEFT: Search + Queue */}
        <div style={{ paddingRight: 20 }}>
          {/* Search */}
          <div className="glass" style={{ padding: 20, marginBottom: 20 }}>
            <h2 style={{ margin: '0 0 14px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              🔍 Add a Song
            </h2>
            <SongSearch onAdd={handleAddSong} />
          </div>

          {/* Queue */}
          <div className="glass" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                🎵 Queue <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.85rem' }}>({queue.length} songs)</span>
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>Vote to reorder</span>
            </div>
            <QueueList
              queue={queue}
              onVote={handleVote}
              onRemove={handleRemove}
              isOwner={isOwner}
            />
          </div>
        </div>

        {/* RIGHT: Now Playing + Members */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 80 }}>
          <div className="glass" style={{ padding: 20 }}>
            <NowPlaying song={nowPlaying} />
          </div>
          <div className="glass" style={{ padding: 20 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>👥 Members</h3>
            <MemberList members={members} />
          </div>

          {/* Join code share */}
          <div className="glass" style={{ padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Invite Friends</div>
            <div
              onClick={() => { navigator.clipboard.writeText(room?.joinCode || ''); toast.success('Code copied!'); }}
              style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '0.18em', color: 'var(--accent)', cursor: 'pointer', userSelect: 'none' }}
            >{room?.joinCode}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginTop: 4 }}>Click to copy</div>
          </div>
        </div>
      </div>

      {/* Mobile responsive: stack columns */}
      <style>{`
        @media (max-width: 768px) {
          .room-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
