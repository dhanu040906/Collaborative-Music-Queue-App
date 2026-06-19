import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { createRoom, getRoomByCode } from '../api/rooms';

const VIBES = [
  { value: 'chill',     label: '🌊 Chill',      desc: 'Laid-back vibes' },
  { value: 'hype',      label: '🔥 Hype',        desc: 'High energy' },
  { value: 'study',     label: '📚 Study',       desc: 'Focus mode' },
  { value: 'party',     label: '🎉 Party',       desc: 'Let\'s go!' },
  { value: 'road-trip', label: '🚗 Road Trip',   desc: 'Miles of music' },
];

export default function LandingPage() {
  const navigate  = useNavigate();
  const { login, isLoggedIn, user } = useAuth();

  const [guestName, setGuestName]   = useState('');
  const [roomName,  setRoomName]    = useState('');
  const [vibe,      setVibe]        = useState('chill');
  const [joinCode,  setJoinCode]    = useState('');
  const [tab,       setTab]         = useState('join'); // 'join' | 'create'

  // Guest login mutation
  const guestMutation = useMutation({
    mutationFn: (name) => api.post('/auth/guest', { displayName: name }).then(r => r.data),
    onSuccess: ({ token, user: u }) => { login(token, u); toast.success(`Welcome, ${u.displayName}! 👋`); },
    onError: () => toast.error('Could not sign in. Try again.'),
  });

  // Create room mutation
  const createMutation = useMutation({
    mutationFn: () => createRoom({ name: roomName.trim() || 'My Collab Room', vibe }),
    onSuccess: (room) => { toast.success(`Room "${room.name}" created!`); navigate(`/room/${room.joinCode}`); },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to create room'),
  });

  // Join room mutation
  const joinMutation = useMutation({
    mutationFn: () => getRoomByCode(joinCode.trim().toUpperCase()),
    onSuccess: (room) => { navigate(`/room/${room.joinCode}`); },
    onError: () => toast.error('Room not found. Check the code!'),
  });

  const handleGuest = () => {
    if (guestMutation.isPending) return;
    guestMutation.mutate(guestName.trim());
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden' }}>
      {/* Background glows */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-10%', left: '20%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(29,185,84,0.12) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-5%', right: '15%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 480 }} className="fade-in-up">
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 56, marginBottom: 12, animation: 'bop 2s ease-in-out infinite' }}>🎵</div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, lineHeight: 1.1 }}>
            <span className="gradient-text">MusicCollab</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 10, fontSize: '1rem' }}>
            The democratic DJ booth. Add songs, vote, vibe together.
          </p>
        </div>

        {/* Auth / Welcome */}
        {!isLoggedIn ? (
          <div className="glass" style={{ padding: 28, marginBottom: 24 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>👤 Who are you?</h2>
            <input
              id="guest-name"
              className="input"
              placeholder="Your display name (optional)"
              value={guestName}
              onChange={e => setGuestName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGuest()}
              style={{ marginBottom: 12 }}
            />
            <button
              id="btn-guest-login"
              className="btn-primary"
              style={{ width: '100%' }}
              onClick={handleGuest}
              disabled={guestMutation.isPending}
            >
              {guestMutation.isPending ? <span className="spin">⟳</span> : '✨'}&nbsp;
              {guestMutation.isPending ? 'Signing in…' : 'Continue as Guest'}
            </button>
          </div>
        ) : (
          <div className="glass" style={{ padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src={user.avatarUrl} alt={user.displayName} style={{ width: 38, height: 38, borderRadius: '50%', border: '2px solid var(--accent)' }} onError={e => e.target.style.display='none'} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.displayName}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Ready to collab 🎧</div>
            </div>
          </div>
        )}

        {/* Tab: Join / Create */}
        {isLoggedIn && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4 }}>
              {['join','create'].map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  flex: 1, padding: '10px', borderRadius: 9, border: 'none', cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.875rem', fontFamily: 'inherit', transition: 'all 0.2s',
                  background: tab === t ? 'var(--accent)' : 'transparent',
                  color: tab === t ? '#000' : 'var(--text-muted)',
                }}>
                  {t === 'join' ? '🔗 Join Room' : '➕ Create Room'}
                </button>
              ))}
            </div>

            {tab === 'join' && (
              <div className="glass fade-in-up" style={{ padding: 24 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 10, color: 'var(--text-muted)', fontSize: '0.85rem' }}>ROOM CODE</label>
                <input
                  id="join-code-input"
                  className="input"
                  placeholder="e.g. AB12CD"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && joinMutation.mutate()}
                  maxLength={6}
                  style={{ marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, fontSize: '1.1rem', textAlign: 'center' }}
                />
                <button
                  id="btn-join-room"
                  className="btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => joinMutation.mutate()}
                  disabled={joinCode.length < 4 || joinMutation.isPending}
                >
                  {joinMutation.isPending ? <><span className="spin">⟳</span> Joining…</> : '🚀 Join Room'}
                </button>
              </div>
            )}

            {tab === 'create' && (
              <div className="glass fade-in-up" style={{ padding: 24 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: 'var(--text-muted)', fontSize: '0.85rem' }}>ROOM NAME</label>
                <input
                  id="room-name-input"
                  className="input"
                  placeholder="Friday Night Jams"
                  value={roomName}
                  onChange={e => setRoomName(e.target.value)}
                  style={{ marginBottom: 18 }}
                />
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 10, color: 'var(--text-muted)', fontSize: '0.85rem' }}>VIBE</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
                  {VIBES.map(v => (
                    <button key={v.value} id={`vibe-${v.value}`} onClick={() => setVibe(v.value)} style={{
                      padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${vibe === v.value ? 'var(--accent)' : 'var(--border)'}`,
                      background: vibe === v.value ? 'var(--accent-dim)' : 'transparent',
                      cursor: 'pointer', textAlign: 'left', color: 'var(--text-primary)', fontFamily: 'inherit', transition: 'all 0.15s',
                    }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{v.label}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{v.desc}</div>
                    </button>
                  ))}
                </div>
                <button
                  id="btn-create-room"
                  className="btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? <><span className="spin">⟳</span> Creating…</> : '🎵 Create Room'}
                </button>
              </div>
            )}
          </>
        )}

        <p style={{ textAlign: 'center', marginTop: 28, color: 'var(--text-faint)', fontSize: '0.75rem' }}>
          No account needed · Works in real-time · 100% free
        </p>
      </div>
    </div>
  );
}
