import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function msToMinSec(ms) {
  const s = Math.floor((ms || 0) / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function QueueItem({ item, onVote, onRemove, isOwner, rank }) {
  const { user } = useAuth();
  const [voting, setVoting] = useState(false);

  const handleVote = async (value) => {
    if (voting) return;
    setVoting(true);
    await onVote(item.id, value);
    setVoting(false);
  };

  const canRemove = isOwner || item.addedBy?.id === user?.id;

  const voteBarWidth = Math.max(0, Math.min(100, 50 + item.voteCount * 10));
  const voteBarColor = item.voteCount >= 0 ? 'var(--accent)' : 'var(--danger)';

  return (
    <div
      className="glass glass-hover"
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
        marginBottom: 8, position: 'relative', overflow: 'hidden',
        animation: 'fadeInUp 0.3s ease both',
      }}
    >
      {/* Rank */}
      <div style={{ width: 24, textAlign: 'center', color: 'var(--text-faint)', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
      </div>

      {/* Album Art */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <img
          src={item.albumArt}
          alt=""
          style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', display: 'block', background: '#1a1a2e' }}
          onError={e => { e.target.style.display = 'none'; }}
        />
      </div>

      {/* Song Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.title}
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.artist}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <div style={{ flex: 1, height: 3, background: 'var(--border)', borderRadius: 9, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${voteBarWidth}%`, background: voteBarColor, borderRadius: 9, transition: 'width 0.4s ease' }} />
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)', flexShrink: 0 }}>{msToMinSec(item.durationMs)}</span>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)', marginTop: 2 }}>
          Added by {item.addedBy?.displayName || 'Someone'}
        </div>
      </div>

      {/* Vote buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <button
          id={`vote-up-${item.id}`}
          onClick={() => handleVote(1)}
          disabled={voting}
          style={{
            width: 34, height: 34, borderRadius: '50%', border: `1.5px solid ${item.myVote === 1 ? 'var(--accent)' : 'var(--border)'}`,
            background: item.myVote === 1 ? 'var(--accent-dim)' : 'transparent',
            color: item.myVote === 1 ? 'var(--accent)' : 'var(--text-muted)',
            cursor: voting ? 'not-allowed' : 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}
        >▲</button>
        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: item.voteCount > 0 ? 'var(--accent)' : item.voteCount < 0 ? 'var(--danger)' : 'var(--text-muted)', minWidth: 24, textAlign: 'center' }}>
          {item.voteCount > 0 ? '+' : ''}{item.voteCount}
        </span>
        <button
          id={`vote-down-${item.id}`}
          onClick={() => handleVote(-1)}
          disabled={voting}
          style={{
            width: 34, height: 34, borderRadius: '50%', border: `1.5px solid ${item.myVote === -1 ? 'var(--danger)' : 'var(--border)'}`,
            background: item.myVote === -1 ? 'var(--danger-dim)' : 'transparent',
            color: item.myVote === -1 ? 'var(--danger)' : 'var(--text-muted)',
            cursor: voting ? 'not-allowed' : 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}
        >▼</button>
      </div>

      {/* Remove */}
      {canRemove && (
        <button
          id={`remove-${item.id}`}
          onClick={() => onRemove(item.id)}
          title="Remove song"
          style={{
            width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'transparent',
            color: 'var(--text-faint)', cursor: 'pointer', fontSize: 14, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}
        >✕</button>
      )}
    </div>
  );
}
