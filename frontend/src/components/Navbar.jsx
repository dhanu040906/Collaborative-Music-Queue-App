import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

export default function Navbar({ room }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(6,6,15,0.85)', backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)', padding: '0 24px',
      display: 'flex', alignItems: 'center', height: 60, gap: 16,
    }}>
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 22 }}>🎵</span>
        <span style={{ fontWeight: 800, fontSize: '1rem', background: 'linear-gradient(135deg, var(--accent), #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          MusicCollab
        </span>
      </Link>

      {room && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <span style={{ color: 'var(--border)' }}>›</span>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{room.name}</span>
          <span
            className={`badge vibe-${room.vibe}`}
            style={{ flexShrink: 0 }}
          >{room.vibe}</span>
          <div style={{ flexShrink: 0, marginLeft: 4 }}>
            <span style={{ background: 'var(--accent-dim)', color: 'var(--accent)', padding: '3px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer', userSelect: 'all' }}
              onClick={() => { navigator.clipboard.writeText(room.joinCode); }}>
              {room.joinCode}
            </span>
          </div>
        </div>
      )}

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {user && (
          <>
            <Link
              to="/transfer"
              id="nav-transfer-link"
              style={{
                textDecoration: 'none',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: location.pathname === '/transfer' ? 'var(--accent)' : 'var(--text-muted)',
                padding: '5px 12px',
                borderRadius: 999,
                border: '1px solid',
                borderColor: location.pathname === '/transfer' ? 'var(--accent-dim)' : 'transparent',
                background: location.pathname === '/transfer' ? 'var(--accent-dim)' : 'transparent',
                transition: 'all 0.18s',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              🔀 Transfer
            </Link>
            <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'var(--text-primary)' }}>
              <img src={user.avatarUrl} alt={user.displayName} style={{ width: 30, height: 30, borderRadius: '50%', border: '2px solid var(--accent)' }} onError={e => e.target.style.display='none'} />
              <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{user.displayName}</span>
            </Link>
            <button onClick={handleLogout} className="btn-ghost" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>Leave</button>
          </>
        )}
      </div>
    </header>
  );
}
