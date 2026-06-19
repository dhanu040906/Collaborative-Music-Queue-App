import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function CallbackPage() {
  const [params]  = useSearchParams();
  const navigate  = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token    = params.get('token');
    const platform = params.get('platform'); // 'spotify' | 'youtube' — set when linking
    const error    = params.get('error');

    if (error) { navigate('/profile?error=' + error); return; }
    if (!token) { navigate('/'); return; }

    // Save token then fetch the updated user profile
    localStorage.setItem('mc_token', token);
    api.get('/auth/me')
      .then(r => {
        login(token, r.data);
        // If this was a platform-linking callback, go back to profile
        navigate(platform ? '/profile' : '/');
      })
      .catch(() => navigate('/'));
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <span style={{ fontSize: 36 }} className="spin">⟳</span>
      <div style={{ color: 'var(--text-muted)' }}>
        {params.get('platform')
          ? `Connecting ${params.get('platform')}…`
          : 'Signing you in…'}
      </div>
    </div>
  );
}

