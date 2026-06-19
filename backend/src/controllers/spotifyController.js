// Mock song library — 30 popular tracks across genres
// Used since no Spotify API credentials are configured.
const MOCK_TRACKS = [
  { id: 'mock_01', title: 'Blinding Lights', artist: 'The Weeknd', albumArt: 'https://i.scdn.co/image/ab67616d0000b273ef017e899c0547b65c67be7e', durationMs: 200040 },
  { id: 'mock_02', title: 'Shape of You', artist: 'Ed Sheeran', albumArt: 'https://i.scdn.co/image/ab67616d0000b27323f9d0a72bc51eba0b7f9be1', durationMs: 233713 },
  { id: 'mock_03', title: 'Levitating', artist: 'Dua Lipa', albumArt: 'https://i.scdn.co/image/ab67616d0000b27399a0de11f9e8a5c24e84f33e', durationMs: 203064 },
  { id: 'mock_04', title: 'Stay', artist: 'The Kid LAROI, Justin Bieber', albumArt: 'https://i.scdn.co/image/ab67616d0000b2737359994525d219f64872d3b1', durationMs: 141806 },
  { id: 'mock_05', title: 'Peaches', artist: 'Justin Bieber', albumArt: 'https://i.scdn.co/image/ab67616d0000b273e6f407c7f3a0ec98845e4431', durationMs: 198082 },
  { id: 'mock_06', title: 'Good 4 U', artist: 'Olivia Rodrigo', albumArt: 'https://i.scdn.co/image/ab67616d0000b273a91c10fe9472d9bd89802e5a', durationMs: 178147 },
  { id: 'mock_07', title: 'Industry Baby', artist: 'Lil Nas X, Jack Harlow', albumArt: 'https://i.scdn.co/image/ab67616d0000b273be82673b5f79d9658ec0a9fd', durationMs: 212000 },
  { id: 'mock_08', title: 'Heat Waves', artist: 'Glass Animals', albumArt: 'https://i.scdn.co/image/ab67616d0000b2739e495fb707973f3390850eea', durationMs: 238805 },
  { id: 'mock_09', title: 'Astronaut In The Ocean', artist: 'Masked Wolf', albumArt: 'https://i.scdn.co/image/ab67616d0000b2737d42b4b3f7ad11b6879f42a8', durationMs: 132612 },
  { id: 'mock_10', title: 'Butter', artist: 'BTS', albumArt: 'https://i.scdn.co/image/ab67616d0000b273fe196e0a5e7baebdbfedf55e', durationMs: 164442 },
  { id: 'mock_11', title: 'Montero (Call Me By Your Name)', artist: 'Lil Nas X', albumArt: 'https://i.scdn.co/image/ab67616d0000b2738c40fc3be4b20e7d24087f56', durationMs: 137735 },
  { id: 'mock_12', title: 'Dynamite', artist: 'BTS', albumArt: 'https://i.scdn.co/image/ab67616d0000b273b5b8b3e4c618b7e01e17c972', durationMs: 199054 },
  { id: 'mock_13', title: 'Save Your Tears', artist: 'The Weeknd', albumArt: 'https://i.scdn.co/image/ab67616d0000b273ef017e899c0547b65c67be7e', durationMs: 215627 },
  { id: 'mock_14', title: 'Watermelon Sugar', artist: 'Harry Styles', albumArt: 'https://i.scdn.co/image/ab67616d0000b2732e8ed79e177ff6011076f5f0', durationMs: 174000 },
  { id: 'mock_15', title: 'positions', artist: 'Ariana Grande', albumArt: 'https://i.scdn.co/image/ab67616d0000b273af0b48bf50fd7e7d6f63c87c', durationMs: 172546 },
  { id: 'mock_16', title: 'Bad Habits', artist: 'Ed Sheeran', albumArt: 'https://i.scdn.co/image/ab67616d0000b273ef017e8991f91780f57c6090', durationMs: 231041 },
  { id: 'mock_17', title: 'Happier Than Ever', artist: 'Billie Eilish', albumArt: 'https://i.scdn.co/image/ab67616d0000b2732a038d3bf875d23e4aeaa84e', durationMs: 298418 },
  { id: 'mock_18', title: 'Permission to Dance', artist: 'BTS', albumArt: 'https://i.scdn.co/image/ab67616d0000b273fe196e0a5e7baebdbfedf55e', durationMs: 187000 },
  { id: 'mock_19', title: 'Shivers', artist: 'Ed Sheeran', albumArt: 'https://i.scdn.co/image/ab67616d0000b273ef017e8991f91780f57c6090', durationMs: 207853 },
  { id: 'mock_20', title: 'Essence', artist: 'Wizkid ft. Tems', albumArt: 'https://i.scdn.co/image/ab67616d0000b273c5cc77d4b36a2ceab0099cfa', durationMs: 280000 },
  { id: 'mock_21', title: 'Mood', artist: '24kGoldn ft. iann dior', albumArt: 'https://i.scdn.co/image/ab67616d0000b273a336e5ad6bf34e8af21b75a4', durationMs: 140533 },
  { id: 'mock_22', title: 'Sunflower', artist: 'Post Malone, Swae Lee', albumArt: 'https://i.scdn.co/image/ab67616d0000b273e2e352d89826aef6dbd5ff8f', durationMs: 158040 },
  { id: 'mock_23', title: 'As It Was', artist: 'Harry Styles', albumArt: 'https://i.scdn.co/image/ab67616d0000b273b46f74efa6c774db4f2ef2ea', durationMs: 167303 },
  { id: 'mock_24', title: 'Anti-Hero', artist: 'Taylor Swift', albumArt: 'https://i.scdn.co/image/ab67616d0000b273bb54dde68cd23e2a268ae0f5', durationMs: 200690 },
  { id: 'mock_25', title: 'Flowers', artist: 'Miley Cyrus', albumArt: 'https://i.scdn.co/image/ab67616d0000b2736f3a04571ad485b84ab58e31', durationMs: 200455 },
  { id: 'mock_26', title: 'Cruel Summer', artist: 'Taylor Swift', albumArt: 'https://i.scdn.co/image/ab67616d0000b273e787cffec20aa2a396a61647', durationMs: 178426 },
  { id: 'mock_27', title: 'SNAP', artist: 'Rosa Linn', albumArt: 'https://i.scdn.co/image/ab67616d0000b2733f4e2f9875fad26e6c1ffa35', durationMs: 163658 },
  { id: 'mock_28', title: 'Unholy', artist: 'Sam Smith, Kim Petras', albumArt: 'https://i.scdn.co/image/ab67616d0000b27394a1c87e3a7c7cc8e050dfba', durationMs: 156943 },
  { id: 'mock_29', title: 'Rich Flex', artist: 'Drake, 21 Savage', albumArt: 'https://i.scdn.co/image/ab67616d0000b27382e00e5f44b9a14d3c08fcd4', durationMs: 211000 },
  { id: 'mock_30', title: 'Calm Down', artist: 'Rema, Selena Gomez', albumArt: 'https://i.scdn.co/image/ab67616d0000b273ab7a30fc3d31ad0a6a28a43e', durationMs: 239492 },
];

// GET /api/spotify/search?q=
exports.searchTracks = (req, res) => {
  const q = (req.query.q || '').toLowerCase().trim();
  if (!q) return res.json([]);

  const results = MOCK_TRACKS.filter(t =>
    t.title.toLowerCase().includes(q) ||
    t.artist.toLowerCase().includes(q)
  ).slice(0, 10);

  res.json(results.map(t => ({
    spotifyTrackId: t.id,
    title: t.title,
    artist: t.artist,
    albumArt: t.albumArt,
    durationMs: t.durationMs,
  })));
};
