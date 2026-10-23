import { useEffect, useState } from 'react';
import api from '../api';
import { useLang } from '../i18n/LanguageContext.jsx';

const PURPOSES = ['patient-visit', 'doctor-meet', 'vendor', 'interview', 'delivery', 'other'];
const todayStr = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const fmtTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function VisitorPass() {
  const { t } = useLang();
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [me, setMe] = useState('');
  const [printP, setPrintP] = useState(null);
  const [f, setF] = useState({ visitorName: '', phone: '', idProofType: 'Aadhaar', idProofNo: '', purpose: 'patient-visit', patientName: '', personToMeet: '', vehicleNo: '', gateNo: 'Gate 1' });

  const load = async () => {
    try {
      const [v, m] = await Promise.all([api.get(`/gatepass?date=${todayStr()}`), api.get('/auth/me')]);
      setList(v.data); setMe(m.data.name || '');
    } catch (e) { console.error(e); }
  };
  useEffect(() => { load(); }, []);

  const issue = async () => {
    if (!f.visitorName.trim() || !f.phone.trim()) { alert(t('gp.name') + ' / ' + t('gp.phone')); return; }
    try {
      const { data } = await api.post('/gatepass', { ...f, issuedBy: me });
      setF({ visitorName: '', phone: '', idProofType: 'Aadhaar', idProofNo: '', purpose: 'patient-visit', patientName: '', personToMeet: '', vehicleNo: '', gateNo: 'Gate 1' });
      setShowForm(false); setPrintP(data); load();
    } catch (e) { alert('Failed'); }
  };

  const checkout = async (id) => {
    try { await api.patch(`/gatepass/${id}/checkout`); load(); }
    catch (e) { alert('Failed'); }
  };

  const filtered = list.filter(v => {
    const s = q.trim().toLowerCase();
    return !s || v.visitorName.toLowerCase().includes(s) || v.phone.includes(s) || (v.passNo || '').toLowerCase().includes(s);
  });
  const inside = list.filter(v => v.status === 'checked-in').length;

  return (
    <div className="space-y-3">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #gatepass-print-area, #gatepass-print-area * { visibility: visible !important; }
          #gatepass-print-area { position: absolute; left: 10px; top: 10px; display: block !important; }
        }
      `}</style>
      <div className="flex justify-between items-center">
        <h3 className="font-bold">🎫 {t('gp.title')} ({inside} {t('gp.in')})</h3>
      </div>
      <div className="flex gap-2">
        <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('gp.search')} value={q} onChange={e => setQ(e.target.value)} />
        <button onClick={() => setShowForm(!showForm)} className="bg-teal-600 px-4 rounded-xl text-sm font-bold">{t('gp.issue')}</button>
      </div>
      {showForm && (
        <div className="bg-gray-800 p-3 rounded-xl space-y-2">
          <div className="flex gap-2">
            <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('gp.name') + ' *'} value={f.visitorName} onChange={e => setF({ ...f, visitorName: e.target.value })} />
            <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('gp.phone') + ' *'} value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <select className="flex-1 bg-gray-700 p-2 rounded text-sm" value={f.idProofType} onChange={e => setF({ ...f, idProofType: e.target.value })}>
              <option>Aadhaar</option><option>Voter ID</option><option>PAN</option><option>Driving License</option>
            </select>
            <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('gp.id_no')} value={f.idProofNo} onChange={e => setF({ ...f, idProofNo: e.target.value })} />
          </div>
          <select className="w-full bg-gray-700 p-2 rounded text-sm" value={f.purpose} onChange={e => setF({ ...f, purpose: e.target.value })}>
            {PURPOSES.map(p => <option key={p} value={p}>{t('gp.purpose_' + p.replace('-', '_')) || p}</option>)}
          </select>
          <div className="flex gap-2">
            <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('gp.patient')} value={f.patientName} onChange={e => setF({ ...f, patientName: e.target.value })} />
            <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('gp.meet')} value={f.personToMeet} onChange={e => setF({ ...f, personToMeet: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('gp.vehicle')} value={f.vehicleNo} onChange={e => setF({ ...f, vehicleNo: e.target.value })} />
            <select className="flex-1 bg-gray-700 p-2 rounded text-sm" value={f.gateNo} onChange={e => setF({ ...f, gateNo: e.target.value })}>
              <option>Gate 1</option><option>Gate 2</option><option>Emergency Gate</option>
            </select>
          </div>
          <button onClick={issue} className="w-full bg-blue-600 py-2 rounded-xl text-sm font-bold">{t('common.save')}</button>
        </div>
      )}
      {printP && (
        <div className="bg-gray-800 p-3 rounded-xl">
          <div id="gatepass-print-area">
            <div style={{ width: 300, background: '#fff', color: '#111', borderRadius: 10, padding: 14, fontFamily: 'sans-serif', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #1565c0', paddingBottom: 6, marginBottom: 8 }}>
                <div style={{ fontWeight: 'bold', fontSize: 15 }}>CityCare Hospital</div>
                <div style={{ fontSize: 11, color: '#1565c0', fontWeight: 'bold' }}>VISITOR PASS</div>
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.7 }}>
                <div><b>{t('gp.pass_no')}:</b> <span style={{ fontSize: 15, fontWeight: 'bold', color: '#1565c0' }}>{printP.passNo}</span></div>
                <div><b>{t('gp.name')}:</b> {printP.visitorName}</div>
                <div><b>{t('gp.phone')}:</b> {printP.phone}</div>
                <div><b>{t('gp.purpose')}:</b> {printP.purpose}</div>
                {printP.personToMeet && <div><b>{t('gp.meet')}:</b> {printP.personToMeet}</div>}
                {printP.patientName && <div><b>{t('gp.patient')}:</b> {printP.patientName}</div>}
                <div><b>{t('gp.gate')}:</b> {printP.gateNo} • <b>{t('gp.checkin')}:</b> {fmtTime(printP.checkIn)}</div>
              </div>
            </div>
          </div>
          <button onClick={() => window.print()} className="w-full mt-2 bg-blue-600 py-2 rounded-xl text-sm font-bold">🖨️ {t('gp.print')}</button>
        </div>
      )}
      <div className="space-y-2">
        {filtered.map(v => (
          <div key={v._id} className="bg-gray-800 p-3 rounded-xl text-xs">
            <div className="flex justify-between items-center">
              <div className="font-semibold text-sm">{v.visitorName} <span className="text-gray-500 font-normal">({v.passNo})</span></div>
              <span className={`px-2 py-1 rounded font-bold ${v.status === 'checked-in' ? 'bg-green-700' : 'bg-gray-600'}`}>
                {v.status === 'checked-in' ? t('gp.in') : t('gp.out')}
              </span>
            </div>
            <div className="text-gray-400 mt-1">{v.phone} • {v.purpose}{v.personToMeet ? ' → ' + v.personToMeet : ''}{v.patientName ? ' → ' + v.patientName : ''}</div>
            <div className="text-gray-500">{t('gp.checkin')}: {fmtTime(v.checkIn)}{v.checkOut ? ` • ${t('gp.checkout')}: ${fmtTime(v.checkOut)}` : ''} • {v.gateNo}</div>
            {v.status === 'checked-in' && (
              <button onClick={() => checkout(v._id)} className="mt-2 bg-orange-600 px-3 py-1 rounded font-bold">{t('gp.checkout')}</button>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="text-gray-500 text-xs">{t('gp.no_visitors')}</p>}
      </div>
    </div>
  );
}
