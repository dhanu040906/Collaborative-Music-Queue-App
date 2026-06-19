import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useTransferWizard } from '../hooks/useTransfer';

// ─── Platform Config ───────────────────────────────────────────────────────────
const PLATFORM_META = {
  spotify: {
    label:    'Spotify',
    icon:     '🎵',
    color:    '#1db954',
    colorDim: 'rgba(29,185,84,0.15)',
    border:   'rgba(29,185,84,0.4)',
  },
  youtube: {
    label:    'YouTube Music',
    icon:     '▶️',
    color:    '#ff0000',
    colorDim: 'rgba(255,0,0,0.12)',
    border:   'rgba(255,0,0,0.35)',
  },
};

// ─── Step Indicator ────────────────────────────────────────────────────────────
function StepIndicator({ current, total = 5 }) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 28 }}>
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        const done    = n < current;
        const active  = n === current;
        return (
          <div key={n} style={{
            width:        done || active ? 28 : 8,
            height:       8,
            borderRadius: 999,
            background:   done    ? 'var(--accent)'
                        : active  ? 'var(--accent)'
                        :           'var(--border)',
            opacity:      done    ? 0.55 : 1,
            transition:   'all 0.3s ease',
          }} />
        );
      })}
    </div>
  );
}

// ─── Platform Card ─────────────────────────────────────────────────────────────
function PlatformCard({ name, selected, connected, disabled, onClick }) {
  const meta = PLATFORM_META[name];
  return (
    <button
      id={`platform-card-${name}`}
      onClick={onClick}
      disabled={disabled}
      style={{
        flex:        1,
        padding:     '20px 12px',
        border:      selected
          ? `2px solid ${meta.color}`
          : `1px solid ${connected ? meta.border : 'var(--border)'}`,
        borderRadius: 16,
        background:  selected ? meta.colorDim : 'var(--bg-card)',
        cursor:      disabled ? 'not-allowed' : 'pointer',
        textAlign:   'center',
        transition:  'all 0.2s',
        opacity:     disabled ? 0.45 : 1,
        transform:   selected ? 'translateY(-2px)' : 'none',
        boxShadow:   selected ? `0 4px 20px ${meta.colorDim}` : 'none',
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 8 }}>{meta.icon}</div>
      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
        {meta.label}
      </div>
      <div style={{ fontSize: '0.72rem', marginTop: 4 }}>
        {connected
          ? <span style={{ color: meta.color }}>✓ Connected</span>
          : <span style={{ color: 'var(--text-muted)' }}>Not connected</span>}
      </div>
    </button>
  );
}

// ─── Loading Spinner ───────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
      <div className="spin" style={{
        width: 36, height: 36,
        border: '3px solid var(--border)',
        borderTopColor: 'var(--accent)',
        borderRadius: '50%',
      }} />
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function TransferPage() {
  const { user, token } = useAuth();
  const navigate        = useNavigate();
  const wizard          = useTransferWizard();

  const connected = user?.connectedPlatforms || {};

  // Redirect guest users
  if (!user) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <Navbar />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: 'calc(100vh - 60px)', gap: 16 }}>
          <div style={{ fontSize: 48 }}>🔒</div>
          <h2 style={{ margin: 0 }}>Login required</h2>
          <button className="btn-primary" onClick={() => navigate('/')}>Go to Home</button>
        </div>
      </div>
    );
  }

  const platformNotConnectedWarning = (platform) => (
    <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)',
      borderRadius: 12, padding: '12px 16px', fontSize: '0.85rem', color: '#fca5a5' }}>
      ⚠️ {PLATFORM_META[platform]?.label} is not connected.{' '}
      <span
        style={{ textDecoration: 'underline', cursor: 'pointer', color: 'var(--accent)' }}
        onClick={() => navigate('/profile')}
      >
        Connect it on your Profile →
      </span>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />

      <div style={{ maxWidth: 560, margin: '40px auto', padding: '0 20px' }} className="fade-in-up">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔀</div>
          <h1 className="gradient-text" style={{ margin: '0 0 6px', fontSize: '1.8rem', fontWeight: 800 }}>
            Transfer Playlist
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            Move your music between Spotify and YouTube Music
          </p>
        </div>

        <div className="glass" style={{ padding: 28 }}>
          <StepIndicator current={wizard.step} />

          {/* ── STEP 1: Choose Source ── */}
          {wizard.step === 1 && (
            <div>
              <h2 style={{ fontSize: '1rem', margin: '0 0 16px', color: 'var(--text-muted)', textAlign: 'center' }}>
                Step 1 — Where are you transferring <em>from</em>?
              </h2>
              <div style={{ display: 'flex', gap: 12 }}>
                {['spotify', 'youtube'].map(p => (
                  <PlatformCard
                    key={p}
                    name={p}
                    selected={wizard.sourcePlatform === p}
                    connected={!!connected[p]}
                    onClick={() => wizard.setSourcePlatform(p)}
                  />
                ))}
              </div>

              {wizard.sourcePlatform && !connected[wizard.sourcePlatform] &&
                <div style={{ marginTop: 16 }}>
                  {platformNotConnectedWarning(wizard.sourcePlatform)}
                </div>
              }

              <button
                id="transfer-step1-next"
                className="btn-primary"
                disabled={!wizard.sourcePlatform || !connected[wizard.sourcePlatform]}
                onClick={() => wizard.setStep(2)}
                style={{ width: '100%', marginTop: 20 }}
              >
                Next → Choose Playlist
              </button>
            </div>
          )}

          {/* ── STEP 2: Choose Playlist ── */}
          {wizard.step === 2 && (
            <div>
              <h2 style={{ fontSize: '1rem', margin: '0 0 16px', color: 'var(--text-muted)', textAlign: 'center' }}>
                Step 2 — Select a {PLATFORM_META[wizard.sourcePlatform].label} playlist
              </h2>

              {wizard.playlistsQuery.isLoading && <Spinner />}
              {wizard.playlistsQuery.isError && (
                <div style={{ color: 'var(--danger)', textAlign: 'center', padding: 16 }}>
                  Failed to load playlists. Try reconnecting your account.
                </div>
              )}

              {wizard.playlistsQuery.data && (
                <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {wizard.playlistsQuery.data.playlists.map(pl => (
                    <button
                      key={pl.id}
                      id={`playlist-${pl.id}`}
                      onClick={() => wizard.setSourcePlaylist(pl)}
                      style={{
                        display:    'flex',
                        alignItems: 'center',
                        gap:        12,
                        padding:    '10px 14px',
                        border:     wizard.sourcePlaylist?.id === pl.id
                          ? `1px solid var(--accent)`
                          : '1px solid var(--border)',
                        borderRadius: 12,
                        background:  wizard.sourcePlaylist?.id === pl.id
                          ? 'var(--accent-dim)'
                          : 'var(--bg-card)',
                        cursor:     'pointer',
                        textAlign:  'left',
                        transition: 'all 0.15s',
                      }}
                    >
                      {pl.thumbnailUrl
                        ? <img src={pl.thumbnailUrl} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                        : <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎵</div>
                      }
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pl.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pl.trackCount} tracks</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button className="btn-ghost" onClick={() => wizard.setStep(1)} style={{ flex: 1 }}>← Back</button>
                <button
                  id="transfer-step2-next"
                  className="btn-primary"
                  disabled={!wizard.sourcePlaylist}
                  onClick={() => wizard.setStep(3)}
                  style={{ flex: 2 }}
                >
                  Preview Tracks →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Preview Tracks ── */}
          {wizard.step === 3 && (
            <div>
              <h2 style={{ fontSize: '1rem', margin: '0 0 4px', color: 'var(--text-muted)', textAlign: 'center' }}>
                Step 3 — Preview
              </h2>
              <div style={{ textAlign: 'center', fontWeight: 700, marginBottom: 14 }}>{wizard.sourcePlaylist.name}</div>

              {wizard.tracksQuery.isLoading && <Spinner />}
              {wizard.tracksQuery.isError && (
                <div style={{ color: 'var(--danger)', textAlign: 'center', padding: 16 }}>Failed to load tracks.</div>
              )}

              {wizard.tracksQuery.data && (
                <>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: 10 }}>
                    {wizard.tracksQuery.data.count} songs found
                  </div>
                  <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {wizard.tracksQuery.data.tracks.map((t, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px',
                        borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                        {t.thumbnailUrl
                          ? <img src={t.thumbnailUrl} alt="" style={{ width: 34, height: 34, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                          : <div style={{ width: 34, height: 34, borderRadius: 6, background: 'var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🎵</div>
                        }
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.artist}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button className="btn-ghost" onClick={() => wizard.setStep(2)} style={{ flex: 1 }}>← Back</button>
                <button
                  id="transfer-step3-next"
                  className="btn-primary"
                  disabled={!wizard.tracksQuery.data || wizard.tracksQuery.data.count === 0}
                  onClick={() => wizard.setStep(4)}
                  style={{ flex: 2 }}
                >
                  Choose Destination →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4: Choose Destination ── */}
          {wizard.step === 4 && (
            <div>
              <h2 style={{ fontSize: '1rem', margin: '0 0 16px', color: 'var(--text-muted)', textAlign: 'center' }}>
                Step 4 — Where are you transferring <em>to</em>?
              </h2>
              <div style={{ display: 'flex', gap: 12 }}>
                {['spotify', 'youtube']
                  .filter(p => p !== wizard.sourcePlatform)
                  .map(p => (
                    <PlatformCard
                      key={p}
                      name={p}
                      selected={wizard.destPlatform === p}
                      connected={!!connected[p]}
                      onClick={() => wizard.setDestPlatform(p)}
                    />
                  ))
                }
              </div>

              {wizard.destPlatform && !connected[wizard.destPlatform] &&
                <div style={{ marginTop: 16 }}>
                  {platformNotConnectedWarning(wizard.destPlatform)}
                </div>
              }

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button className="btn-ghost" onClick={() => wizard.setStep(3)} style={{ flex: 1 }}>← Back</button>
                <button
                  id="transfer-step4-next"
                  className="btn-primary"
                  disabled={!wizard.destPlatform || !connected[wizard.destPlatform]}
                  onClick={() => wizard.setStep(5)}
                  style={{ flex: 2 }}
                >
                  Name Your Playlist →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 5: Name + Confirm ── */}
          {wizard.step === 5 && (
            <div>
              <h2 style={{ fontSize: '1rem', margin: '0 0 16px', color: 'var(--text-muted)', textAlign: 'center' }}>
                Step 5 — Name the new playlist
              </h2>

              <input
                id="transfer-dest-name"
                className="input"
                placeholder={wizard.sourcePlaylist?.name || 'Playlist name'}
                value={wizard.destName}
                onChange={e => wizard.setDestName(e.target.value)}
              />

              {/* Summary card */}
              <div style={{ marginTop: 18, padding: '14px 16px', borderRadius: 12,
                border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>Transfer summary</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem' }}>
                  <span style={{ fontWeight: 700, color: PLATFORM_META[wizard.sourcePlatform].color }}>
                    {PLATFORM_META[wizard.sourcePlatform].icon} {PLATFORM_META[wizard.sourcePlatform].label}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>→</span>
                  <span style={{ fontWeight: 700, color: PLATFORM_META[wizard.destPlatform].color }}>
                    {PLATFORM_META[wizard.destPlatform].icon} {PLATFORM_META[wizard.destPlatform].label}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', marginTop: 6, color: 'var(--text-muted)' }}>
                  "{wizard.sourcePlaylist?.name}" · {wizard.tracksQuery.data?.count || '?'} songs
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button className="btn-ghost" onClick={() => wizard.setStep(4)} style={{ flex: 1 }}>← Back</button>
                <button
                  id="transfer-start-btn"
                  className="btn-primary"
                  disabled={wizard.transferMutation.isPending}
                  onClick={() => wizard.transferMutation.mutate()}
                  style={{ flex: 2 }}
                >
                  {wizard.transferMutation.isPending
                    ? <><span className="spin" style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', display: 'inline-block' }} /> Transferring…</>
                    : '🚀 Start Transfer'}
                </button>
              </div>

              {wizard.transferMutation.isError && (
                <div style={{ marginTop: 12, color: 'var(--danger)', fontSize: '0.83rem', textAlign: 'center' }}>
                  {wizard.transferMutation.error?.response?.data?.error || 'Transfer failed. Please try again.'}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 6: Results ── */}
          {wizard.step === 6 && wizard.result && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>
                {wizard.result.transferred === wizard.result.totalTracks ? '🎉' : '✅'}
              </div>
              <h2 style={{ margin: '0 0 6px', fontSize: '1.3rem', fontWeight: 800 }}>Transfer Complete!</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 20px' }}>
                Moved to <strong style={{ color: PLATFORM_META[wizard.result.destPlatform]?.color }}>
                  {PLATFORM_META[wizard.result.destPlatform]?.label}
                </strong>
              </p>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <div className="glass" style={{ flex: 1, padding: '14px 10px', borderRadius: 12 }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent)' }}>
                    {wizard.result.transferred}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>Transferred</div>
                </div>
                <div className="glass" style={{ flex: 1, padding: '14px 10px', borderRadius: 12 }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: wizard.result.failed > 0 ? 'var(--danger)' : 'var(--accent)' }}>
                    {wizard.result.failed}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>Not Found</div>
                </div>
                <div className="glass" style={{ flex: 1, padding: '14px 10px', borderRadius: 12 }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{wizard.result.totalTracks}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>Total Songs</div>
                </div>
              </div>

              {/* Failed tracks */}
              {wizard.result.failedTracks?.length > 0 && (
                <FailedTracksAccordion tracks={wizard.result.failedTracks} />
              )}

              {/* CTA buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
                {wizard.result.playlistUrl && (
                  <a
                    href={wizard.result.playlistUrl}
                    target="_blank"
                    rel="noreferrer"
                    id="transfer-open-playlist"
                    className="btn-primary"
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    🔗 Open Playlist
                  </a>
                )}
                <button id="transfer-again-btn" className="btn-ghost" onClick={wizard.reset}>
                  ↩️ Transfer Another Playlist
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Failed Tracks Accordion ───────────────────────────────────────────────────
function FailedTracksAccordion({ tracks }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ textAlign: 'left', marginBottom: 4 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--danger)', fontSize: '0.82rem', padding: '4px 0',
          display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}
      >
        <span>{open ? '▾' : '▸'}</span>
        {tracks.length} song{tracks.length > 1 ? 's' : ''} couldn't be matched
      </button>
      {open && (
        <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
          {tracks.map((t, i) => (
            <div key={i} style={{ fontSize: '0.78rem', padding: '5px 10px',
              borderRadius: 8, background: 'rgba(239,68,68,0.07)',
              border: '1px solid rgba(239,68,68,0.15)', color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--text-primary)' }}>{t.title}</span>
              {t.artist && <span> — {t.artist}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
