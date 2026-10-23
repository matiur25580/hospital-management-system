import { useEffect, useState } from 'react';
import api from '../api';
import { useLang } from '../i18n/LanguageContext.jsx';

const SLOTS = ['09:00', '10:00', '11:00', '12:00', '17:00', '18:00', '19:00', '20:00'];
const todayStr = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

export default function Telemedicine({ mode }) {
  const { t } = useLang();
  const [list, setList] = useState([]);
  const [depts, setDepts] = useState([]);
  const [me, setMe] = useState({ email: '', name: '' });
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState({ department: '', doctorEmail: '', date: todayStr(), timeSlot: '10:00', symptoms: '', patientPhone: '' });
  const [rxId, setRxId] = useState(null);
  const [rxText, setRxText] = useState('');

  const load = async () => {
    try {
      const m = await api.get('/auth/me');
      const email = m.data.email || '';
      setMe({ email, name: m.data.name || '' });
      let url = '/tele';
      if (mode === 'patient') url += '?patientEmail=' + encodeURIComponent(email);
      if (mode === 'doctor') url += '?doctorEmail=' + encodeURIComponent(email);
      const [tc, dp] = await Promise.all([api.get(url), api.get('/departments')]);
      setList(tc.data); setDepts(dp.data);
    } catch (e) { console.error(e); }
  };
  useEffect(() => { load(); }, []);

  const deptDoctors = (depts.find(d => d.name === f.department)?.doctors) || [];

  const book = async () => {
    if (!f.department || !f.doctorEmail || !f.symptoms.trim()) { alert(t('tl.symptoms')); return; }
    const doc = deptDoctors.find(d => d.email === f.doctorEmail) || {};
    try {
      await api.post('/tele', {
        patientName: me.name, patientEmail: me.email, patientPhone: f.patientPhone,
        doctorName: doc.name || '', doctorEmail: f.doctorEmail, department: f.department,
        date: f.date, timeSlot: f.timeSlot, symptoms: f.symptoms, fee: 300
      });
      setShowForm(false); setF({ department: '', doctorEmail: '', date: todayStr(), timeSlot: '10:00', symptoms: '', patientPhone: '' });
      load();
    } catch (e) { alert('Failed'); }
  };

  const act = async (id, body) => {
    try { await api.patch(`/tele/${id}`, body); setRxId(null); setRxText(''); load(); }
    catch (e) { alert('Failed'); }
  };

  const stColor = { requested: 'bg-yellow-700', confirmed: 'bg-blue-700', 'in-progress': 'bg-purple-700', completed: 'bg-green-700', cancelled: 'bg-red-700' };

  return (
    <div className="space-y-3">
      <h3 className="font-bold">📹 {t('tl.title')}</h3>
      <p className="text-[11px] text-gray-500">ℹ️ {t('tl.how')}</p>

      {mode === 'patient' && (
        <button onClick={() => setShowForm(!showForm)} className="w-full bg-teal-600 py-2 rounded-xl text-sm font-bold">{t('tl.book')}</button>
      )}
      {showForm && mode === 'patient' && (
        <div className="bg-gray-800 p-3 rounded-xl space-y-2">
          <div className="flex gap-2">
            <select className="flex-1 bg-gray-700 p-2 rounded text-sm" value={f.department} onChange={e => setF({ ...f, department: e.target.value, doctorEmail: '' })}>
              <option value="">{t('hr.dept')}</option>
              {depts.map(d => <option key={d.code} value={d.name}>{d.name}</option>)}
            </select>
            <select className="flex-1 bg-gray-700 p-2 rounded text-sm" value={f.doctorEmail} onChange={e => setF({ ...f, doctorEmail: e.target.value })}>
              <option value="">Doctor</option>
              {deptDoctors.map(d => <option key={d.email} value={d.email}>{d.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <input type="date" min={todayStr()} className="flex-1 bg-gray-700 p-2 rounded text-sm" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} />
            <select className="flex-1 bg-gray-700 p-2 rounded text-sm" value={f.timeSlot} onChange={e => setF({ ...f, timeSlot: e.target.value })}>
              {SLOTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('tl.symptoms') + ' *'} value={f.symptoms} onChange={e => setF({ ...f, symptoms: e.target.value })} />
          <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('amb.phone')} value={f.patientPhone} onChange={e => setF({ ...f, patientPhone: e.target.value })} />
          <div className="text-xs text-gray-400">{t('tl.fee')}</div>
          <button onClick={book} className="w-full bg-blue-600 py-2 rounded-xl text-sm font-bold">{t('common.save')}</button>
        </div>
      )}

      <div className="text-xs font-bold text-gray-400">{mode === 'patient' ? t('tl.my') : t('tl.requests')} ({list.length})</div>
      <div className="space-y-2">
        {list.map(c => (
          <div key={c._id} className="bg-gray-800 p-3 rounded-xl text-xs">
            <div className="flex justify-between items-center">
              <div className="font-semibold text-sm">{mode === 'patient' ? c.doctorName : c.patientName} <span className="text-gray-500 font-normal">({c.department})</span></div>
              <span className={`px-2 py-1 rounded font-bold ${stColor[c.status]}`}>{t('tl.st_' + c.status.replace('-', '_')).toUpperCase()}</span>
            </div>
            <div className="text-gray-400 mt-1">📅 {c.date} • 🕐 {c.timeSlot} • {t('tl.symptoms')}: {c.symptoms}</div>
            {c.meetingLink && (c.status === 'confirmed' || c.status === 'in-progress') && (
              <a href={c.meetingLink} target="_blank" rel="noreferrer" className="block mt-2 bg-green-600 text-center py-2 rounded-xl text-sm font-bold">📹 {t('tl.join')}</a>
            )}
            {c.prescription && (
              <div className="mt-2 bg-white text-gray-900 p-2 rounded text-xs"><b>℞ {t('tl.prescription')}:</b><div className="whitespace-pre-wrap">{c.prescription}</div></div>
            )}
            {mode === 'doctor' && c.status === 'requested' && (
              <div className="flex gap-2 mt-2">
                <button onClick={() => act(c._id, { status: 'confirmed' })} className="flex-1 bg-blue-600 py-1 rounded font-bold">{t('tl.confirm')}</button>
                <button onClick={() => act(c._id, { status: 'cancelled' })} className="bg-gray-600 px-3 py-1 rounded">✕</button>
              </div>
            )}
            {mode === 'doctor' && c.status === 'confirmed' && (
              <button onClick={() => act(c._id, { status: 'in-progress' })} className="w-full mt-2 bg-purple-600 py-1 rounded font-bold">{t('tl.join')}</button>
            )}
            {mode === 'doctor' && c.status === 'in-progress' && rxId !== c._id && (
              <button onClick={() => setRxId(c._id)} className="w-full mt-2 bg-green-600 py-1 rounded font-bold">{t('tl.complete')}</button>
            )}
            {rxId === c._id && (
              <div className="mt-2 space-y-2">
                <textarea className="w-full bg-gray-700 p-2 rounded text-sm" rows="3" placeholder={t('tl.write_rx')} value={rxText} onChange={e => setRxText(e.target.value)} />
                <button onClick={() => act(c._id, { status: 'completed', prescription: rxText })} className="w-full bg-green-600 py-1 rounded font-bold">{t('tl.complete')}</button>
              </div>
            )}
          </div>
        ))}
        {list.length === 0 && <p className="text-gray-500 text-xs">{t('tl.no_tl')}</p>}
      </div>
    </div>
  );
}
