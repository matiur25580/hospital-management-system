import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', padding: 16 }}>
      <form onSubmit={handleSubmit} style={{ background: '#1e293b', padding: 32, borderRadius: 12, width: '100%', maxWidth: 380 }}>
        <h2 style={{ color: '#fff', marginBottom: 8 }}>🏥 Hospital Login</h2>
        <p style={{ color: '#94a3b8', marginBottom: 24, fontSize: 14 }}>Sign in to access the dashboard</p>
        {error && <div style={{ background: '#7f1d1d', color: '#fecaca', padding: 10, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required
          style={{ width: '100%', padding: 12, marginBottom: 12, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#fff', boxSizing: 'border-box' }} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required
          style={{ width: '100%', padding: 12, marginBottom: 20, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#fff', boxSizing: 'border-box' }} />
        <button type="submit" disabled={loading} style={{ width: '100%', padding: 12, borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Signing in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
