import { useEffect, useState } from 'react';
import api from '../api';
import { useLang } from '../i18n/LanguageContext.jsx';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function DoctorSchedule() {
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [weekly, setWeekly] = useState(DAYS.map(d => ({ day: d, start: '09:00', end: '17:00', active: d !== 'Sunday' })));
  const [leaves, setLeaves] = useState([]);
  const [leaveDate, setLeaveDate] = useState('');

  useEffect(() => {
    (async () => {
      let em = '', nm = '';
      try {
        const me = await api.get('/auth/me');
        em = me.data.email || ''; nm = me.data.name || '';
      } catch (e) { console.warn('auth/me failed:', e.message); }
      if (!em) {
        try {
          const u = JSON.parse(sessionStorage.getItem('hms_user') || '{}');
          em = u.email || ''; nm = u.name || u.fullName || '';
        } catch {}
      }
      setEmail(em); setName(nm);
      if (em) {
        try {
          const { data } = await api.get('/schedules?doctorEmail=' + encodeURIComponent(em));
          if (data.weekly && data.weekly.length) setWeekly(data.weekly);
          setLeaves(data.leaves || []);
        } catch (e) { console.error(e); }
      }
    })();
  }, []);

  const upd = (i, k, v) => setWeekly(weekly.map((w, j) => (j === i ? { ...w, [k]: v } : w)));

  const save = async () => {
    if (!email) { alert('Session e doctor email paini — logout kore abar login koro'); return; }
    try { await api.post('/schedules', { doctorEmail: email, doctorName: name, weekly }); alert(t('sch.saved')); }
    catch (e) { alert('Failed: ' + (e.response?.data?.message || e.message)); }
  };

  const addLeave = async () => {
    if (!leaveDate) { alert(t('common.date')); return; }
    try {
      const { data } = await api.post('/schedules/leave', { doctorEmail: email, date: leaveDate });
      setLeaves(data.leaves || []); setLeaveDate('');
    } catch (e) { alert('Failed'); }
  };

  const delLeave = async (d) => {
    try {
      const { data } = await api.delete('/schedules/leave', { data: { doctorEmail: email, date: d } });
      setLeaves(data.leaves || []);
    } catch (e) { alert('Failed'); }
  };

  return (
    <div className="space-y-3">
      <h3 className="font-bold">{t('sch.title')}</h3>
      {weekly.map((w, i) => (
        <div key={w.day} className="bg-gray-800 p-3 rounded-xl flex items-center gap-2">
          <input type="checkbox" checked={w.active} onChange={e => upd(i, 'active', e.target.checked)} className="w-4 h-4" />
          <span className="w-16 text-sm font-semibold">{w.day.slice(0, 3)}</span>
          <input type="time" value={w.start} disabled={!w.active} onChange={e => upd(i, 'start', e.target.value)} className="bg-gray-700 p-1 rounded text-sm flex-1 disabled:opacity-40" />
          <span className="text-gray-500 text-xs">-</span>
          <input type="time" value={w.end} disabled={!w.active} onChange={e => upd(i, 'end', e.target.value)} className="bg-gray-700 p-1 rounded text-sm flex-1 disabled:opacity-40" />
        </div>
      ))}
      <button onClick={save} className="w-full bg-blue-600 py-2 rounded-xl font-bold text-sm">{t('sch.save')}</button>
      <h3 className="font-bold pt-2">{t('sch.leaves')}</h3>
      <div className="flex gap-2">
        <input type="date" value={leaveDate} onChange={e => setLeaveDate(e.target.value)} className="flex-1 bg-gray-700 p-2 rounded text-sm" />
        <button onClick={addLeave} className="bg-yellow-600 px-4 rounded font-bold text-sm">{t('sch.add_leave')}</button>
      </div>
      <div className="space-y-1">
        {leaves.map((l, i) => (
          <div key={i} className="bg-gray-800 p-2 rounded-xl flex justify-between items-center text-sm">
            <span>{new Date(l).toDateString()}</span>
            <button onClick={() => delLeave(l)} className="text-red-400 text-xs">{t('sch.remove')}</button>
          </div>
        ))}
        {leaves.length === 0 && <p className="text-gray-500 text-xs">{t('sch.no_leaves')}</p>}
      </div>
    </div>
  );
}
