import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  fetchPlaylists,
  fetchPlaylistTracks,
  startTransfer as apiStartTransfer,
  connectPlatform as apiConnectPlatform,
  disconnectPlatform as apiDisconnectPlatform,
} from '../api/transfer';

// ─── useConnectedPlatforms ─────────────────────────────────────────────────────
// Thin wrapper — just reads from the auth user object.
// Export a connect/disconnect action pair.
export function usePlatformActions(token, refetchUser) {
  const [disconnecting, setDisconnecting] = useState(null);

  const connect = (platform) => apiConnectPlatform(platform, token);

  const disconnect = async (platform) => {
    setDisconnecting(platform);
    try {
      await apiDisconnectPlatform(platform);
      if (refetchUser) await refetchUser();
    } finally {
      setDisconnecting(null);
    }
  };

  return { connect, disconnect, disconnecting };
}

// ─── useTransferWizard ─────────────────────────────────────────────────────────
export function useTransferWizard() {
  const [step, setStep]                   = useState(1); // 1-6
  const [sourcePlatform, setSourcePlatform] = useState(null);  // 'spotify' | 'youtube'
  const [sourcePlaylist, setSourcePlaylist] = useState(null);  // { id, name }
  const [destPlatform, setDestPlatform]   = useState(null);
  const [destName, setDestName]           = useState('');
  const [result, setResult]               = useState(null);

  // Step 2 — fetch playlists from source platform
  const playlistsQuery = useQuery({
    queryKey:  ['transfer-playlists', sourcePlatform],
    queryFn:   () => fetchPlaylists(sourcePlatform),
    enabled:   !!sourcePlatform && step >= 2,
    staleTime: 30_000,
  });

  // Step 3 — preview tracks
  const tracksQuery = useQuery({
    queryKey:  ['transfer-tracks', sourcePlatform, sourcePlaylist?.id],
    queryFn:   () => fetchPlaylistTracks(sourcePlatform, sourcePlaylist?.id),
    enabled:   !!sourcePlaylist && step >= 3,
    staleTime: 30_000,
  });

  // Step 6 — transfer mutation
  const transferMutation = useMutation({
    mutationFn: () => apiStartTransfer({
      sourcePlatform,
      sourcePlaylistId: sourcePlaylist.id,
      destPlatform,
      destPlaylistName: destName || sourcePlaylist.name,
    }),
    onSuccess: (data) => { setResult(data); setStep(6); },
  });

  const reset = () => {
    setStep(1); setSourcePlatform(null); setSourcePlaylist(null);
    setDestPlatform(null); setDestName(''); setResult(null);
  };

  return {
    step, setStep,
    sourcePlatform, setSourcePlatform,
    sourcePlaylist, setSourcePlaylist,
    destPlatform, setDestPlatform,
    destName, setDestName,
    result,
    playlistsQuery,
    tracksQuery,
    transferMutation,
    reset,
  };
}
