function msToMinSec(ms) {
  const s = Math.floor((ms || 0) / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function NowPlaying({ song }) {
  if (!song) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-faint)', fontSize: '0.85rem' }}>
        <div style={{ fontSize: 28, marginBottom: 6 }}>⏸️</div>
        Nothing playing yet.<br/>Add songs and upvote your favourites!
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: 12, textTransform: 'uppercase' }}>
        🎶 Now Playing
      </div>
      <div style={{ position: 'relative', display: 'inline-block', marginBottom: 14 }}>
        <img
          src={song.albumArt}
          alt={song.title}
          style={{ width: 110, height: 110, borderRadius: 16, objectFit: 'cover', boxShadow: '0 8px 32px rgba(29,185,84,0.3)' }}
          onError={e => { e.target.style.background='#1a1a2e'; e.target.src=''; }}
        />
        <div style={{ position: 'absolute', inset: 0, borderRadius: 16, border: '2px solid var(--accent)', animation: 'pulse-ring 2.5s infinite' }} />
      </div>
      <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 2, padding: '0 8px' }}>{song.title}</div>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 4 }}>{song.artist}</div>
      <div style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600 }}>
        👍 {song.voteCount > 0 ? '+' : ''}{song.voteCount} votes
      </div>
    </div>
  );
}
