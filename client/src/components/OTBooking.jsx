import { useEffect, useState } from 'react';
import api from '../api';
import { useLang } from '../i18n/LanguageContext.jsx';

const todayLocal = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

const emptyF = { patientName: '', patientEmail: '', surgeryType: '', department: '', surgeonEmail: '', anesthetistName: '', assistantDoctors: '', nurseNames: '', otNo: '', date: '', startTime: '', endTime: '', notes: '' };

export default function OTBooking({ mode }) {
  const { t } = useLang();
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [depts, setDepts] = useState([]);
  const [date, setDate] = useState(todayLocal());
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState({ ...emptyF, date: todayLocal() });
  const [me, setMe] = useState('');

  const load = async (d) => {
    try {
      const [rm, bk, dp, m] = await Promise.all([
        api.get('/ot/rooms'), api.get(`/ot/bookings?date=${d}`), api.get('/departments'), api.get('/auth/me')
      ]);
      setRooms(rm.data); setBookings(bk.data); setDepts(dp.data); setMe(m.data.name || '');
    } catch (e) { console.error(e); }
  };
  useEffect(() => { load(date); }, [date]);

  const allDoctors = depts.flatMap(d => (d.doctors || []).map(doc => ({ ...doc, dept: d.name })));
  const anesthetists = allDoctors.filter(d => d.dept === 'Anesthesiology');

  const book = async () => {
    if (!f.patientName.trim() || !f.surgeryType.trim() || !f.otNo || !f.startTime || !f.endTime || !f.surgeonEmail) {
      alert('Patient, surgery, OT, surgeon and time required'); return;
    }
    const surgeon = allDoctors.find(d => d.email === f.surgeonEmail);
    try {
      await api.post('/ot/bookings', {
        ...f,
        surgeonName: surgeon ? surgeon.name : '',
        department: surgeon ? surgeon.dept : f.department,
        assistantDoctors: f.assistantDoctors.split(',').map(s => s.trim()).filter(Boolean),
        nurseNames: f.nurseNames.split(',').map(s => s.trim()).filter(Boolean),
        bookedBy: me
      });
      setF({ ...emptyF, date }); setShowForm(false); load(date);
    } catch (e) { alert('Failed: ' + (e.response?.data?.message || e.message)); }
  };

  const setStatus = async (id, status) => {
    try { await api.patch(`/ot/bookings/${id}`, { status }); load(date); }
    catch (e) { alert('Failed'); }
  };

  const stColor = { scheduled: 'bg-yellow-700', 'in-progress': 'bg-blue-700', completed: 'bg-green-700', cancelled: 'bg-gray-600' };
  const roomColor = { available: 'bg-green-700', occupied: 'bg-red-700', maintenance: 'bg-yellow-700' };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-bold">🔪 {t('ot.title')}</h3>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-gray-700 p-1 rounded text-sm" />
      </div>

      <div className="text-xs font-bold text-gray-400">{t('ot.rooms')}</div>
      <div className="grid grid-cols-2 gap-2">
        {rooms.map(rm => (
          <div key={rm._id} className="bg-gray-800 p-3 rounded-xl">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm">{rm.otNo}</span>
              <span className={`text-xs px-2 py-1 rounded font-bold ${roomColor[rm.status]}`}>{rm.status.toUpperCase()}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">{rm.type} • {rm.floor}</div>
          </div>
        ))}
      </div>

      <button onClick={() => setShowForm(!showForm)} className="w-full bg-teal-600 py-2 rounded-xl text-sm font-bold">{t('ot.book')}</button>
      {showForm && (
        <div className="bg-gray-800 p-3 rounded-xl space-y-2">
          <div className="flex gap-2">
            <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('common.name') + ' *'} value={f.patientName} onChange={e => setF({ ...f, patientName: e.target.value })} />
            <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('common.email')} value={f.patientEmail} onChange={e => setF({ ...f, patientEmail: e.target.value })} />
          </div>
          <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('ot.surgery') + ' * (e.g. Appendectomy)'} value={f.surgeryType} onChange={e => setF({ ...f, surgeryType: e.target.value })} />
          <div className="flex gap-2">
            <select className="flex-1 bg-gray-700 p-2 rounded text-sm" value={f.otNo} onChange={e => setF({ ...f, otNo: e.target.value })}>
              <option value="">OT...</option>
              {rooms.filter(rm => rm.status === 'available').map(rm => <option key={rm._id} value={rm.otNo}>{rm.otNo} ({rm.type})</option>)}
            </select>
            <input type="date" className="flex-1 bg-gray-700 p-2 rounded text-sm" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <input type="time" className="flex-1 bg-gray-700 p-2 rounded text-sm" value={f.startTime} onChange={e => setF({ ...f, startTime: e.target.value })} />
            <input type="time" className="flex-1 bg-gray-700 p-2 rounded text-sm" value={f.endTime} onChange={e => setF({ ...f, endTime: e.target.value })} />
          </div>
          <select className="w-full bg-gray-700 p-2 rounded text-sm" value={f.surgeonEmail} onChange={e => setF({ ...f, surgeonEmail: e.target.value })}>
            <option value="">{t('ot.surgeon')} *</option>
            {allDoctors.map(d => <option key={d.email} value={d.email}>{d.name} ({d.dept})</option>)}
          </select>
          <select className="w-full bg-gray-700 p-2 rounded text-sm" value={f.anesthetistName} onChange={e => setF({ ...f, anesthetistName: e.target.value })}>
            <option value="">{t('ot.anesthetist')}</option>
            {anesthetists.map(d => <option key={d.email} value={d.name}>{d.name}</option>)}
          </select>
          <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('ot.assistants')} value={f.assistantDoctors} onChange={e => setF({ ...f, assistantDoctors: e.target.value })} />
          <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('ot.nurses')} value={f.nurseNames} onChange={e => setF({ ...f, nurseNames: e.target.value })} />
          <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('ot.notes')} value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} />
          <button onClick={book} className="w-full bg-blue-600 py-2 rounded-xl text-sm font-bold">{t('common.save')}</button>
        </div>
      )}

      <div className="text-xs font-bold text-gray-400">{t('ot.upcoming')} ({bookings.length})</div>
      <div className="space-y-2">
        {bookings.map(b => (
          <div key={b._id} className="bg-gray-800 p-3 rounded-xl text-xs">
            <div className="flex justify-between items-center">
              <div className="font-semibold text-sm">{b.surgeryType} <span className="text-gray-500 font-normal">({b.otNo})</span></div>
              <span className={`px-2 py-1 rounded font-bold ${stColor[b.status]}`}>{b.status.toUpperCase()}</span>
            </div>
            <div className="text-gray-400 mt-1">Patient: {b.patientName} • {b.date} {b.startTime}-{b.endTime}</div>
            <div className="text-gray-400">🔪 {b.surgeonName} • 💉 {b.anesthetistName || '-'}</div>
            {(b.assistantDoctors || []).length > 0 && <div className="text-gray-500">+ Doctors: {b.assistantDoctors.join(', ')}</div>}
            {(b.nurseNames || []).length > 0 && <div className="text-gray-500">+ Nurses: {b.nurseNames.join(', ')}</div>}
            {b.status === 'scheduled' && (
              <div className="flex gap-2 mt-2">
                <button onClick={() => setStatus(b._id, 'in-progress')} className="bg-blue-600 px-3 py-1 rounded font-bold">Start</button>
                <button onClick={() => setStatus(b._id, 'cancelled')} className="bg-gray-600 px-3 py-1 rounded">✕</button>
              </div>
            )}
            {b.status === 'in-progress' && (
              <button onClick={() => setStatus(b._id, 'completed')} className="mt-2 bg-green-600 px-3 py-1 rounded font-bold">Complete</button>
            )}
          </div>
        ))}
        {bookings.length === 0 && <p className="text-gray-500 text-xs">{t('ot.no_bookings')}</p>}
      </div>
    </div>
  );
}
