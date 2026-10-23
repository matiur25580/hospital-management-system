import { useAuth } from '../../context/AuthContext';
export function DashShell({ title, color, stats, actions }) {
  const { user, logout } = useAuth();
  return (
    <div style={{ minHeight:'100vh', background:'var(--hms-bg)', color:'var(--hms-text)', fontFamily:'system-ui', padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h2 style={{ margin:0 }}>🏥 {title}</h2>
          <p style={{ color:'var(--hms-muted)', margin:'4px 0 0' }}>Welcome, {user?.name || 'User'} ({user?.role || ''})</p>
        </div>
        <button onClick={logout} style={{ background:'#dc2626', color:'#fff', border:'none', borderRadius:8, padding:'10px 18px', cursor:'pointer' }}>Logout</button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:14, marginBottom:28 }}>
        {stats.map(([label,val]) => (
          <div key={label} style={{ background:'var(--hms-surface)', border:`1px solid ${color}55`, borderRadius:12, padding:16 }}>
            <div style={{ fontSize:26, fontWeight:700, color }}>{val}</div>
            <div style={{ color:'var(--hms-muted)', fontSize:13, marginTop:4 }}>{label}</div>
          </div>
        ))}
      </div>
      <h3 style={{ marginBottom:12 }}>Quick Actions</h3>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:14 }}>
        {actions.map(a => (
          <button key={a} style={{ background:'var(--hms-surface)', border:'1px solid var(--hms-border)', color:'var(--hms-text)', borderRadius:12, padding:20, cursor:'pointer', fontSize:14 }}>{a}</button>
        ))}
      </div>
    </div>
  );
}
