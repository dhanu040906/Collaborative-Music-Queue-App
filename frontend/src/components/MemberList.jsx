export default function MemberList({ members }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse-ring 2s infinite' }} />
        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {members.length} {members.length === 1 ? 'member' : 'members'} online
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {members.map((m, i) => (
          <div key={m.userId || i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              <img
                src={m.avatarUrl}
                alt={m.displayName}
                style={{ width: 36, height: 36, borderRadius: '50%', background: '#1a1a2e', objectFit: 'cover', border: '2px solid var(--accent)' }}
                onError={e => { e.target.style.display='none'; }}
              />
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, background: 'var(--accent)', borderRadius: '50%', border: '2px solid var(--bg-base)' }} />
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
              {m.displayName}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
