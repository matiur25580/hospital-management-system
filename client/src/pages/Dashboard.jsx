import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();
  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff', padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1>Hospital Dashboard</h1>
        <button onClick={logout} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer' }}>Logout</button>
      </div>
      <div style={{ background: '#1e293b', padding: 24, borderRadius: 12 }}>
        <h3>Welcome, {user && user.name ? user.name : 'Guest'}!</h3>
        <p style={{ color: '#94a3b8' }}>Role: {user?.role || '-'} | Email: {user?.email || '-'}</p>
        <p style={{ color: '#22c55e', marginTop: 16 }}>Login flow working - JWT auth connected!</p>
      </div>
    </div>
  );
}
