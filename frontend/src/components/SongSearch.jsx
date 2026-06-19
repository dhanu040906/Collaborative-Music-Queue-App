import { useEffect, useRef, useState } from 'react';
import { searchTracks } from '../api/spotify';

function msToMinSec(ms) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function SongSearch({ onAdd }) {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open,    setOpen]    = useState(false);
  const debounce = useRef(null);
  const ref = useRef(null);

  useEffect(() => {
    clearTimeout(debounce.current);
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchTracks(query);
        setResults(data);
        setOpen(true);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 350);
    return () => clearTimeout(debounce.current);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleAdd = (track) => {
    onAdd(track);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none', color: 'var(--text-muted)' }}>🔍</span>
        <input
          id="song-search-input"
          className="input"
          placeholder="Search songs to add…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          style={{ paddingLeft: 40, paddingRight: loading ? 40 : 16 }}
        />
        {loading && (
          <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }} className="spin">⟳</span>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="glass" style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
          zIndex: 100, maxHeight: 360, overflowY: 'auto', borderRadius: 14,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}>
          {results.map((track, i) => (
            <div
              key={track.spotifyTrackId}
              id={`search-result-${i}`}
              onClick={() => handleAdd(track)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                cursor: 'pointer', transition: 'background 0.15s', borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <img
                src={track.albumArt}
                alt=""
                style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                onError={e => { e.target.src = ''; e.target.style.background = '#333'; }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.title}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.artist}</div>
              </div>
              <div style={{ color: 'var(--text-faint)', fontSize: '0.75rem', flexShrink: 0 }}>{msToMinSec(track.durationMs)}</div>
              <div style={{ color: 'var(--accent)', fontSize: '1.1rem', flexShrink: 0 }}>＋</div>
            </div>
          ))}
        </div>
      )}

      {open && query && results.length === 0 && !loading && (
        <div className="glass" style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 100, padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          No songs found for "{query}"
        </div>
      )}
    </div>
  );
}
