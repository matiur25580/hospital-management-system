import { useEffect, useRef, useState } from 'react';
import api from '../api';
import { useLang } from '../i18n/LanguageContext.jsx';

const ROLE_COLORS = {
  management: '#b8860b', doctor: '#1565c0', nurse: '#2e7d32',
  receptionist: '#6a1b9a', security: '#e65100', support: '#455a64'
};
const GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''];

export default function IDCard({ mode }) {
  const { t } = useLang();
  const [staff, setStaff] = useState([]);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [blood, setBlood] = useState('');
  const [valid, setValid] = useState('');
  const fileRef = useRef(null);

  const load = async () => {
    try {
      const m = await api.get('/auth/me');
      const { data } = await api.get('/staff/profiles');
      if (mode === 'staff') {
        setSel(data.find(p => p.email === m.data.email) || null);
      } else {
        setStaff(data);
      }
    } catch (e) { console.error(e); }
  };
  useEffect(() => { load(); }, []);

  const pick = (p) => { setSel(p); setBlood(p.bloodGroup || ''); setValid(p.validUntil || ''); };

  const onPhoto = (e) => {
    const file = e.target.files[0];
    if (!file || !sel) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setUploading(true);
        await api.patch(`/staff/profiles/${sel._id}`, { photo: reader.result });
        setSel({ ...sel, photo: reader.result });
        setStaff(staff.map(x => (x._id === sel._id ? { ...x, photo: reader.result } : x)));
      } catch (err) { alert('Upload failed - photo too large? Try a smaller photo.'); }
      finally { setUploading(false); }
    };
    reader.readAsDataURL(file);
  };

  const saveDetails = async () => {
    if (!sel) return;
    try {
      await api.patch(`/staff/profiles/${sel._id}`, { bloodGroup: blood, validUntil: valid });
      setSel({ ...sel, bloodGroup: blood, validUntil: valid });
      alert(t('common.save') + ' ✓');
    } catch (e) { alert('Failed'); }
  };

  const filtered = staff.filter(p => {
    const s = q.trim().toLowerCase();
    return !s || p.name.toLowerCase().includes(s) || (p.designation || '').toLowerCase().includes(s) || (p.employeeId || '').toLowerCase().includes(s);
  });

  const color = ROLE_COLORS[sel?.roleCategory] || '#455a64';
  const qrData = sel ? `CITYCARE|${sel.employeeId}|${sel.name}|${sel.designation}` : '';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=72x72&data=${encodeURIComponent(qrData)}`;

  const cardStyle = {
    width: 340, borderRadius: 12, overflow: 'hidden', background: '#ffffff', color: '#111',
    fontFamily: 'sans-serif', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
    boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
  };

  const CardFront = () => (
    <div style={cardStyle}>
      <div style={{ background: color, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 'bold', color: '#fff', fontSize: 15 }}>CityCare Hospital</div>
          <div style={{ color: '#fff', fontSize: 9, opacity: 0.9 }}>Newtown, Kolkata • {t('id.title').toUpperCase()}</div>
        </div>
        <span style={{ fontSize: 9, background: 'rgba(255,255,255,0.25)', color: '#fff', padding: '2px 8px', borderRadius: 10, fontWeight: 'bold' }}>
          {sel.employmentType === 'government' ? t('hr.govt') : t('hr.private')}
        </span>
      </div>
      <div style={{ display: 'flex', padding: 10, gap: 10 }}>
        {sel.photo
          ? <img src={sel.photo} alt="photo" style={{ width: 78, height: 94, objectFit: 'cover', borderRadius: 6, border: `2px solid ${color}` }} />
          : <div style={{ width: 78, height: 94, borderRadius: 6, background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>👤</div>}
        <div style={{ flex: 1, fontSize: 11, lineHeight: 1.5 }}>
          <div style={{ fontWeight: 'bold', fontSize: 14 }}>{sel.name}</div>
          <div style={{ color }}>{sel.designation}</div>
          <div style={{ color: '#666' }}>{sel.department}</div>
          <div style={{ marginTop: 4 }}><b>{t('id.emp_id')}:</b> {sel.employeeId}</div>
          {sel.bloodGroup && <div><b>{t('id.blood')}:</b> <span style={{ color: '#c62828', fontWeight: 'bold' }}>{sel.bloodGroup}</span></div>}
        </div>
        <img src={qrUrl} alt="QR" style={{ width: 72, height: 72 }} onError={(e) => { e.target.style.display = 'none'; }} />
      </div>
      <div style={{ background: '#f5f5f5', padding: '5px 12px', fontSize: 9, display: 'flex', justifyContent: 'space-between', color: '#555' }}>
        <span>{t('id.valid')}: <b>{sel.validUntil || '—'}</b></span>
        <span>{t('id.holder_sign')}: ______</span>
      </div>
    </div>
  );

  const CardBack = () => (
    <div style={{ ...cardStyle, padding: 14, fontSize: 10, color: '#333' }}>
      <div style={{ fontWeight: 'bold', fontSize: 12, marginBottom: 6, color }}>{t('id.terms')}</div>
      <div style={{ marginBottom: 6 }}>⚠️ {t('id.if_found')}</div>
      <div style={{ marginBottom: 2 }}>📍 {t('id.address')}</div>
      <div style={{ marginBottom: 10 }}>📞 {t('id.helpline')}</div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #333', paddingTop: 2, fontSize: 9 }}>{t('id.sign')}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-3 no-print-container">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #idcard-print-area, #idcard-print-area * { visibility: visible !important; }
          #idcard-print-area { position: absolute; left: 10px; top: 10px; display: block !important; }
        }
      `}</style>
      <h3 className="font-bold">🪪 {t('id.title')}</h3>

      {mode === 'admin' && (
        <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('id.search')}
          value={q} onChange={e => setQ(e.target.value)} />
      )}

      {mode === 'admin' && !sel && (
        <div className="max-h-64 overflow-y-auto space-y-1">
          {filtered.map(p => (
            <button key={p._id} onClick={() => pick(p)} className="w-full bg-gray-800 p-2 rounded-xl text-xs flex justify-between items-center text-left">
              <span className="font-semibold">{p.name} <span className="text-gray-500 font-normal">({p.designation})</span></span>
              <span className="text-xs px-2 py-1 rounded font-bold" style={{ background: ROLE_COLORS[p.roleCategory] || '#455a64' }}>{p.employeeId}</span>
            </button>
          ))}
          {filtered.length === 0 && <p className="text-gray-500 text-xs">{t('ana.no_data')}</p>}
        </div>
      )}

      {mode === 'staff' && !sel && (
        <p className="text-gray-500 text-xs">{t('id.no_profile')}</p>
      )}

      {sel && (
        <div className="space-y-3">
          <div id="idcard-print-area" className="space-y-3">
            <CardFront />
            <CardBack />
          </div>

          <div className="flex gap-2">
            {mode === 'admin' && <button onClick={() => setSel(null)} className="bg-gray-700 px-4 py-2 rounded-xl text-sm">←</button>}
            <button onClick={() => window.print()} className="flex-1 bg-blue-600 py-2 rounded-xl text-sm font-bold">🖨️ {t('id.print')}</button>
          </div>

          {mode === 'admin' && (
            <div className="bg-gray-800 p-3 rounded-xl space-y-2">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhoto} />
              <button onClick={() => fileRef.current.click()} disabled={uploading} className="w-full bg-teal-600 py-2 rounded-xl text-sm font-bold">
                {uploading ? t('id.uploading') : '📷 ' + t('id.upload_photo')}
              </button>
              <div className="flex gap-2">
                <select className="flex-1 bg-gray-700 p-2 rounded text-sm" value={blood} onChange={e => setBlood(e.target.value)}>
                  <option value="">{t('id.blood')}</option>
                  {GROUPS.filter(g => g).map(g => <option key={g}>{g}</option>)}
                </select>
                <input type="date" className="flex-1 bg-gray-700 p-2 rounded text-sm" value={valid} onChange={e => setValid(e.target.value)} />
              </div>
              <button onClick={saveDetails} className="w-full bg-purple-600 py-2 rounded-xl text-sm font-bold">{t('id.save_details')}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
