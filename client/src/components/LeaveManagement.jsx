import { useEffect, useState } from 'react';
import api from '../api';
import { useLang } from '../i18n/LanguageContext.jsx';

const TYPES = ['sick', 'casual', 'earned', 'maternity', 'paternity'];

export default function LeaveManagement({ mode }) {
  const { t } = useLang();
  const [tab, setTab] = useState(mode === 'hr' ? 'pending' : 'my');
  const [leaves, setLeaves] = useState([]);
  const [me, setMe] = useState({ email: '', name: '', role: '' });
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState({ leaveType: 'casual', fromDate: '', toDate: '', reason: '' });
  const [remarks, setRemarks] = useState({});

  const days = (a, b) => (a && b ? Math.round((new Date(b) - new Date(a)) / 86400000) + 1 : 0);

  const load = async (tb) => {
    try {
      const m = await api.get('/auth/me');
      setMe({ email: m.data.email || '', name: m.data.name || '', role: m.data.role || '' });
      let url = '/hr/leave';
      if (mode === 'staff') url += '?staffEmail=' + encodeURIComponent(m.data.email || '');
      else url += tb === 'pending' ? '?status=pending' : '';
      const { data } = await api.get(url);
      setLeaves(data);
    } catch (e) { console.error(e); }
  };
  useEffect(() => { load(tab); }, [tab]);

  const apply = async () => {
    const d = days(f.fromDate, f.toDate);
    if (d <= 0 || !f.reason.trim()) { alert(t('lv.reason')); return; }
    try {
      await api.post('/hr/leave/apply', {
        staffEmail: me.email, staffName: me.name, designation: me.role,
        leaveType: f.leaveType, fromDate: f.fromDate, toDate: f.toDate, days: d, reason: f.reason
      });
      setF({ leaveType: 'casual', fromDate: '', toDate: '', reason: '' });
      setShowForm(false); alert(t('lv.applied')); load(tab);
    } catch (e) { alert('Failed'); }
  };

  const decide = async (id, status) => {
    try {
      await api.patch(`/hr/leave/${id}/decide`, { status, remarks: remarks[id] || '', decidedBy: me.name });
      load(tab);
    } catch (e) { alert('Failed'); }
  };

  const stColor = { pending: 'bg-yellow-700', approved: 'bg-green-700', rejected: 'bg-red-700' };

  const Card = ({ l }) => (
    <div className="bg-gray-800 p-3 rounded-xl text-xs">
      <div className="flex justify-between items-center">
        <div className="font-semibold text-sm">{l.staffName} <span className="text-gray-500 font-normal">({l.designation})</span></div>
        <span className={`px-2 py-1 rounded font-bold ${stColor[l.status]}`}>{l.status.toUpperCase()}</span>
      </div>
      <div className="text-gray-400 mt-1">{t('lv.' + l.leaveType)} • {l.fromDate} → {l.toDate} • <b>{l.days} {t('lv.days')}</b></div>
      <div className="text-gray-500">{t('lv.reason')}: {l.reason}</div>
      {l.decidedBy && <div className="text-gray-500">{t('lv.decided_by')}: {l.decidedBy}{l.remarks ? ' - ' + l.remarks : ''}</div>}
      {mode === 'hr' && l.status === 'pending' && (
        <div className="mt-2 space-y-2">
          <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('lv.remarks')}
            value={remarks[l._id] || ''} onChange={e => setRemarks({ ...remarks, [l._id]: e.target.value })} />
          <div className="flex gap-2">
            <button onClick={() => decide(l._id, 'approved')} className="flex-1 bg-green-600 py-1 rounded font-bold">{t('lv.approve')}</button>
            <button onClick={() => decide(l._id, 'rejected')} className="flex-1 bg-red-600 py-1 rounded font-bold">{t('lv.reject')}</button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      <h3 className="font-bold">🌴 {t('lv.title')}</h3>
      {mode === 'hr' ? (
        <div className="flex gap-2">
          <button onClick={() => setTab('pending')} className={`flex-1 py-1 rounded text-sm font-bold ${tab === 'pending' ? 'bg-blue-600' : 'bg-gray-700'}`}>{t('lv.pending')} ({leaves.filter(l => l.status === 'pending').length})</button>
          <button onClick={() => setTab('history')} className={`flex-1 py-1 rounded text-sm font-bold ${tab === 'history' ? 'bg-blue-600' : 'bg-gray-700'}`}>{t('lv.history')}</button>
        </div>
      ) : (
        <button onClick={() => setShowForm(!showForm)} className="w-full bg-teal-600 py-2 rounded-xl text-sm font-bold">{t('lv.apply')}</button>
      )}
      {showForm && mode === 'staff' && (
        <div className="bg-gray-800 p-3 rounded-xl space-y-2">
          <select className="w-full bg-gray-700 p-2 rounded text-sm" value={f.leaveType} onChange={e => setF({ ...f, leaveType: e.target.value })}>
            {TYPES.map(ty => <option key={ty} value={ty}>{t('lv.' + ty)}</option>)}
          </select>
          <div className="flex gap-2 items-center">
            <input type="date" className="flex-1 bg-gray-700 p-2 rounded text-sm" value={f.fromDate} onChange={e => setF({ ...f, fromDate: e.target.value })} />
            <span className="text-gray-500">→</span>
            <input type="date" className="flex-1 bg-gray-700 p-2 rounded text-sm" value={f.toDate} onChange={e => setF({ ...f, toDate: e.target.value })} />
          </div>
          {days(f.fromDate, f.toDate) > 0 && <div className="text-xs font-bold">{days(f.fromDate, f.toDate)} {t('lv.days')}</div>}
          <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('lv.reason') + ' *'} value={f.reason} onChange={e => setF({ ...f, reason: e.target.value })} />
          <button onClick={apply} className="w-full bg-blue-600 py-2 rounded-xl text-sm font-bold">{t('common.save')}</button>
        </div>
      )}
      <div className="space-y-2">
        {leaves.map(l => <Card key={l._id} l={l} />)}
        {leaves.length === 0 && <p className="text-gray-500 text-xs">{mode === 'hr' && tab === 'pending' ? t('lv.no_pending') : t('ana.no_data')}</p>}
      </div>
    </div>
  );
}
