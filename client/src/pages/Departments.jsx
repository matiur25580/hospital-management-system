import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

export default function Departments() {
  const navigate = useNavigate();
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get('/departments');
        setDepts(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load departments');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const q = search.trim().toLowerCase();
  const filtered = depts.filter(d =>
    ((d.name || '') + ' ' + (d.code || '')).toLowerCase().includes(q)
  );

  const inputStyle = { width: '100%', boxSizing: 'border-box', background: 'var(--hms-surface)', color: 'var(--hms-text)', border: '1px solid var(--hms-border)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 15 };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--hms-bg)', color: 'var(--hms-text)', padding: 24, fontFamily: 'system-ui' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ margin: 0 }}>🏥 Hospital Departments</h2>
          <button onClick={() => navigate('/dashboard')} style={{ background: 'var(--hms-surface)', color: 'var(--hms-text)', border: '1px solid var(--hms-border)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>← Dashboard</button>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search department..." style={inputStyle} />
        {loading && <p style={{ color: 'var(--hms-muted)' }}>Loading departments…</p>}
        {error && <p style={{ color: '#ef4444' }}>⚠️ {error}</p>}
        {!loading && !error && filtered.length === 0 && (
          <p style={{ color: 'var(--hms-muted)' }}>{depts.length === 0 ? 'No departments found in database yet.' : 'No departments match your search.'}</p>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
          {filtered.map(d => (
            <div key={d._id || d.code} onClick={() => setSelected(d)} style={{ background: 'var(--hms-surface)', border: '1px solid var(--hms-border)', borderRadius: 14, padding: 18, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ background: 'var(--hms-primary)', color: '#fff', borderRadius: 6, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>{d.code}</span>
                <span style={{ color: 'var(--hms-muted)', fontSize: 13 }}>📍 {d.floor || '—'}</span>
              </div>
              <h3 style={{ margin: '0 0 6px' }}>{d.name}</h3>
              <p style={{ margin: 0, color: 'var(--hms-muted)', fontSize: 13 }}>👨‍⚕️ HOD: {d.hod || '—'}</p>
              <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 13, color: 'var(--hms-muted)' }}>
                <span>🩺 {d.doctors?.length || 0} doctors</span>
                <span>👩‍⚕️ {d.nurseCount || 0} nurses</span>
              </div>
              {d.opdDays?.length > 0 && <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--hms-muted)' }}>🗓️ {d.opdDays.join(', ')}</p>}
            </div>
          ))}
        </div>
      </div>
      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 50 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--hms-surface)', color: 'var(--hms-text)', border: '1px solid var(--hms-border)', borderRadius: 16, padding: 28, maxWidth: 560, width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <span style={{ background: 'var(--hms-primary)', color: '#fff', borderRadius: 6, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>{selected.code}</span>
                <h2 style={{ margin: '8px 0 0' }}>{selected.name}</h2>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--hms-muted)', fontSize: 22, cursor: 'pointer' }}>✕</button>
            </div>
            {selected.description && <p style={{ color: 'var(--hms-muted)', fontSize: 14 }}>{selected.description}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '16px 0', fontSize: 14 }}>
              <div>📍 <b>Floor:</b> {selected.floor || '—'}</div>
              <div>🚪 <b>OPD Rooms:</b> {selected.opdRooms?.join(', ') || '—'}</div>
              <div>👨‍⚕️ <b>HOD:</b> {selected.hod || '—'}</div>
              <div>👩‍⚕️ <b>Nurses:</b> {selected.nurseCount || 0}</div>
              <div>🗓️ <b>OPD Days:</b> {selected.opdDays?.join(', ') || '—'}</div>
              <div>⏰ <b>Sessions:</b> {selected.sessions?.join(', ') || '—'}</div>
            </div>
            {selected.scheduleNote && <p style={{ fontSize: 13, color: 'var(--hms-muted)', fontStyle: 'italic' }}>📝 {selected.scheduleNote}</p>}
            {selected.doctors?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4 style={{ marginBottom: 8 }}>Doctors ({selected.doctors.length})</h4>
                {selected.doctors.map((doc, i) => (
                  <div key={i} style={{ border: '1px solid var(--hms-border)', borderRadius: 10, padding: 12, marginBottom: 8 }}>
                    <div style={{ fontWeight: 600 }}>{doc.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--hms-muted)' }}>{doc.designation}{doc.qualification ? ` • ${doc.qualification}` : ''}</div>
                    {doc.email && <div style={{ fontSize: 12, color: 'var(--hms-muted)' }}>{doc.email}</div>}
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setSelected(null)} style={{ marginTop: 16, width: '100%', background: 'var(--hms-primary)', color: '#fff', border: 'none', borderRadius: 10, padding: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
