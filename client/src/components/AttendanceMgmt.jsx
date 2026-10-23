import { useEffect, useState } from 'react';
import api from '../api';
import { useLang } from '../i18n/LanguageContext.jsx';

const todayLocal = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};
const monthLocal = () => todayLocal().slice(0, 7);
const fmtTime = (x) => x ? new Date(x).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';

export default function AttendanceMgmt({ mode }) {
  const { t } = useLang();
  const [me, setMe] = useState({ email: '', name: '', role: '' });
  const [todayRec, setTodayRec] = useState(null);
  const [myMonth, setMyMonth] = useState([]);
  const [leaveForm, setLeaveForm] = useState({ fromDate: '', toDate: '', reason: '' });
  const [myLeaves, setMyLeaves] = useState([]);
  const [todayAll, setTodayAll] = useState([]);
  const [summary, setSummary] = useState([]);
  const [pending, setPending] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/auth/me');
        setMe({ email: data.email || '', name: data.name || '', role: data.role || '' });
      } catch (e) { console.error(e); }
    })();
  }, []);

  const loadMine = async (email) => {
    try {
      const [tr, mr, lr] = await Promise.all([
        api.get(`/attendance?staffEmail=${encodeURIComponent(email)}&date=${todayLocal()}`),
        api.get(`/attendance?staffEmail=${encodeURIComponent(email)}&month=${monthLocal()}`),
        api.get(`/attendance/leaves?staffEmail=${encodeURIComponent(email)}`)
      ]);
      setTodayRec(tr.data[0] || null); setMyMonth(mr.data); setMyLeaves(lr.data);
    } catch (e) { console.error(e); }
  };

  const loadAdmin = async () => {
    try {
      const [ta, sm, pl] = await Promise.all([
        api.get(`/attendance?date=${todayLocal()}`),
        api.get(`/attendance/summary?month=${monthLocal()}`),
        api.get('/attendance/leaves?status=pending')
      ]);
      setTodayAll(ta.data); setSummary(sm.data); setPending(pl.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { if (me.email) { loadMine(me.email); if (mode === 'admin') loadAdmin(); } }, [me.email]);

  const checkin = async () => {
    try {
      await api.post('/attendance/checkin', { staffEmail: me.email, staffName: me.name, role: me.role });
      loadMine(me.email); if (mode === 'admin') loadAdmin();
    } catch (e) { alert('Failed: ' + (e.response?.data?.message || e.message)); }
  };

  const checkout = async () => {
    try { await api.post('/attendance/checkout', { staffEmail: me.email }); loadMine(me.email); if (mode === 'admin') loadAdmin(); }
    catch (e) { alert('Failed: ' + (e.response?.data?.message || e.message)); }
  };

  const applyLeave = async () => {
    if (!leaveForm.fromDate || !leaveForm.toDate) { alert(t('common.date')); return; }
    try {
      await api.post('/attendance/leaves', { staffEmail: me.email, staffName: me.name, role: me.role, ...leaveForm });
      setLeaveForm({ fromDate: '', toDate: '', reason: '' });
      loadMine(me.email); alert(t('att.applied'));
    } catch (e) { alert('Failed'); }
  };

  const decide = async (id, status) => {
    try { await api.patch(`/attendance/leaves/${id}`, { status, decidedBy: me.name }); loadAdmin(); }
    catch (e) { alert('Failed'); }
  };

  const myHours = myMonth.reduce((s, x) => (x.checkIn && x.checkOut) ? s + (new Date(x.checkOut) - new Date(x.checkIn)) / 3600000 : s, 0);
  const myPresent = myMonth.filter(x => x.status === 'present').length;

  return (
    <div className="space-y-3">
      <h3 className="font-bold">{t('att.title')}</h3>
      <div className="bg-gray-800 p-3 rounded-xl flex justify-between items-center">
        <div className="text-sm">
          <div className="font-semibold">{me.name} <span className="text-gray-500 font-normal">({me.role})</span></div>
          <div className="text-xs text-gray-400">{todayRec ? `In ${fmtTime(todayRec.checkIn)} • Out ${fmtTime(todayRec.checkOut)}` : t('att.notin')}</div>
          <div className="text-xs text-gray-400">{t('att.month')}: {myPresent} {t('att.days')} • {myHours.toFixed(1)} {t('att.hrs')}</div>
        </div>
        {!todayRec
          ? <button onClick={checkin} className="bg-green-600 px-4 py-2 rounded-xl text-sm font-bold">{t('att.checkin')}</button>
          : !todayRec.checkOut
            ? <button onClick={checkout} className="bg-yellow-600 px-4 py-2 rounded-xl text-sm font-bold">{t('att.checkout')}</button>
            : <span className="text-xs text-gray-500 font-bold">{t('att.done')} ✓</span>}
      </div>
      <div className="bg-gray-800 p-3 rounded-xl space-y-2">
        <div className="text-sm font-bold">{t('att.leave')}</div>
        <div className="flex gap-2">
          <input type="date" className="flex-1 bg-gray-700 p-2 rounded text-sm" value={leaveForm.fromDate} onChange={e => setLeaveForm({ ...leaveForm, fromDate: e.target.value })} />
          <input type="date" className="flex-1 bg-gray-700 p-2 rounded text-sm" value={leaveForm.toDate} onChange={e => setLeaveForm({ ...leaveForm, toDate: e.target.value })} />
        </div>
        <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('common.reason')} value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} />
        <button onClick={applyLeave} className="w-full bg-blue-600 py-1 rounded text-sm font-bold">{t('common.apply')}</button>
        <div className="space-y-1">
          {myLeaves.slice(0, 5).map(l => (
            <div key={l._id} className="text-xs flex justify-between bg-gray-700 p-2 rounded">
              <span>{new Date(l.fromDate).toLocaleDateString()} → {new Date(l.toDate).toLocaleDateString()} • {l.reason}</span>
              <span className={`font-bold ${l.status === 'approved' ? 'text-green-400' : l.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'}`}>{l.status.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
      {mode === 'admin' && (
        <>
          <div className="bg-gray-800 p-3 rounded-xl space-y-1">
            <div className="text-sm font-bold">{t('att.today')} ({todayAll.length})</div>
            {todayAll.map(x => (
              <div key={x._id} className="text-xs flex justify-between bg-gray-700 p-2 rounded">
                <span>{x.staffName} <span className="text-gray-500">({x.role})</span></span>
                <span className="text-gray-400">In {fmtTime(x.checkIn)} • Out {fmtTime(x.checkOut)}</span>
              </div>
            ))}
            {todayAll.length === 0 && <p className="text-gray-500 text-xs">{t('att.nobody')}</p>}
          </div>
          <div className="bg-gray-800 p-3 rounded-xl space-y-1">
            <div className="text-sm font-bold">{t('att.summary')} ({monthLocal()})</div>
            {summary.map(s => (
              <div key={s._id} className="text-xs flex justify-between bg-gray-700 p-2 rounded">
                <span>{s.name} <span className="text-gray-500">({s.role})</span></span>
                <span className="font-bold text-green-400">{s.present}/{s.days} {t('att.days')}</span>
              </div>
            ))}
            {summary.length === 0 && <p className="text-gray-500 text-xs">{t('att.norec')}</p>}
          </div>
          <div className="bg-gray-800 p-3 rounded-xl space-y-2">
            <div className="text-sm font-bold">{t('att.requests')} ({pending.length} {t('att.pending')})</div>
            {pending.map(l => (
              <div key={l._id} className="bg-gray-700 p-2 rounded text-xs">
                <div className="flex justify-between">
                  <span className="font-semibold">{l.staffName} <span className="text-gray-500">({l.role})</span></span>
                  <span className="text-gray-400">{new Date(l.fromDate).toLocaleDateString()} → {new Date(l.toDate).toLocaleDateString()}</span>
                </div>
                <div className="text-gray-400 mt-1">{l.reason}</div>
                <div className="flex gap-2 mt-1">
                  <button onClick={() => decide(l._id, 'approved')} className="bg-green-600 px-3 py-1 rounded font-bold">{t('common.approve')}</button>
                  <button onClick={() => decide(l._id, 'rejected')} className="bg-red-600 px-3 py-1 rounded font-bold">{t('common.reject')}</button>
                </div>
              </div>
            ))}
            {pending.length === 0 && <p className="text-gray-500 text-xs">{t('att.nopend')}</p>}
          </div>
        </>
      )}
    </div>
  );
}
