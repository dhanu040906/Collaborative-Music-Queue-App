import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { usePlatformActions } from '../hooks/useTransfer';

const PLATFORM_META = {
  spotify: {
    label:   'Spotify',
    icon:    '🎵',
    color:   '#1db954',
    colorDim:'rgba(29,185,84,0.15)',
    border:  'rgba(29,185,84,0.35)',
  },
  youtube: {
    label:   'YouTube Music',
    icon:    '▶️',
    color:   '#ff0000',
    colorDim:'rgba(255,0,0,0.1)',
    border:  'rgba(255,0,0,0.3)',
  },
};

export default function ProfilePage() {
  const { user, token, logout, login } = useAuth();
  const navigate = useNavigate();
  const [refreshTick, setRefreshTick] = useState(0);

  const refetchUser = async () => {
    // Re-fetch user from /auth/me and update context
    const { default: api } = await import('../api/client');
    const { data } = await api.get('/auth/me');
    // login() preserves the token but updates the user object in context
    login(token, data);
    setRefreshTick(t => t + 1);
  };

  const { connect, disconnect, disconnecting } = usePlatformActions(token, refetchUser);

  const handleLogout = () => { logout(); navigate('/'); };

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <button className="btn-primary" onClick={() => navigate('/')}>← Back to Home</button>
      </div>
    );
  }

  const connected = user.connectedPlatforms || {};

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 500, margin: '48px auto', padding: '0 20px' }} className="fade-in-up">

        {/* ── User Card ── */}
        <div className="glass" style={{ padding: 32, textAlign: 'center', marginBottom: 16 }}>
          <img
            src={user.avatarUrl}
            alt={user.displayName}
            style={{ width: 90, height: 90, borderRadius: '50%', border: '3px solid var(--accent)', marginBottom: 16, objectFit: 'cover' }}
            onError={e => e.target.style.display = 'none'}
          />
          <h1 style={{ margin: '0 0 6px', fontSize: '1.5rem', fontWeight: 800 }}>{user.displayName}</h1>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 24 }}>
            {user.isGuest ? '👤 Guest User' : '🎵 Music User'}
            {user.email && <span style={{ marginLeft: 8 }}>· {user.email}</span>}
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-ghost" onClick={() => navigate('/')}>🏠 Home</button>
            <button className="btn-ghost" onClick={() => navigate('/transfer')}>🔀 Transfer Playlist</button>
            <button className="btn-primary" onClick={handleLogout} style={{ background: 'var(--danger)' }}>
              🚪 Log Out
            </button>
          </div>
        </div>

        {/* ── Connected Platforms ── */}
        <div className="glass" style={{ padding: 24, marginBottom: 16 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700 }}>🔗 Connected Accounts</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(PLATFORM_META).map(([key, meta]) => {
              const isConnected = !!connected[key];
              const isDisconnecting = disconnecting === key;
              return (
                <div key={key} style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          12,
                  padding:      '12px 16px',
                  borderRadius: 12,
                  border:       isConnected ? `1px solid ${meta.border}` : '1px solid var(--border)',
                  background:   isConnected ? meta.colorDim : 'var(--bg-card)',
                  transition:   'all 0.2s',
                }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{meta.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{meta.label}</div>
                    <div style={{ fontSize: '0.75rem', color: isConnected ? meta.color : 'var(--text-muted)', marginTop: 2 }}>
                      {isConnected ? '✓ Connected' : 'Not connected'}
                    </div>
                  </div>
                  {isConnected ? (
                    <button
                      id={`disconnect-${key}`}
                      className="btn-ghost"
                      disabled={isDisconnecting}
                      onClick={() => disconnect(key)}
                      style={{ padding: '6px 14px', fontSize: '0.78rem', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}
                    >
                      {isDisconnecting ? 'Unlinking…' : 'Disconnect'}
                    </button>
                  ) : (
                    <button
                      id={`connect-${key}`}
                      className="btn-primary"
                      onClick={() => connect(key)}
                      style={{ padding: '6px 16px', fontSize: '0.78rem', background: meta.color }}
                    >
                      Connect
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Transfer CTA if both connected */}
          {connected.spotify && connected.youtube && (
            <button
              id="go-to-transfer"
              className="btn-primary"
              onClick={() => navigate('/transfer')}
              style={{ width: '100%', marginTop: 16 }}
            >
              🔀 Transfer a Playlist Now
            </button>
          )}
        </div>

        {/* ── Tip ── */}
        <div className="glass" style={{ padding: 20, textAlign: 'center' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            💡 Connect both platforms to transfer playlists between them!
          </div>
        </div>
      </div>
    </div>
  );
}
