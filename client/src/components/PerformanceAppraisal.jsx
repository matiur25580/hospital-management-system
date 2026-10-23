import { useEffect, useState } from 'react';
import api from '../api';
import { useLang } from '../i18n/LanguageContext.jsx';

const RKEYS = ['punctuality', 'patientCare', 'teamwork', 'skills', 'discipline'];
const curPeriod = () => {
  const d = new Date();
  return d.getFullYear() + '-' + (d.getMonth() < 6 ? 'H1' : 'H2');
};

export default function PerformanceAppraisal({ mode }) {
  const { t } = useLang();
  const [list, setList] = useState([]);
  const [staff, setStaff] = useState([]);
  const [me, setMe] = useState({ email: '', name: '' });
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState({ staffEmail: '', reviewPeriod: curPeriod(), ratings: { punctuality: 3, patientCare: 3, teamwork: 3, skills: 3, discipline: 3 }, strengths: '', improvements: '', goals: '' });
  const [ackId, setAckId] = useState(null);
  const [ackText, setAckText] = useState('');

  const load = async () => {
    try {
      const m = await api.get('/auth/me');
      setMe({ email: m.data.email || '', name: m.data.name || '' });
      let url = '/hr/appraisal';
      if (mode === 'staff') url += '?staffEmail=' + encodeURIComponent(m.data.email || '');
      const [a, s] = await Promise.all([api.get(url), mode === 'hr' ? api.get('/staff/profiles') : Promise.resolve({ data: [] })]);
      setList(a.data); setStaff(s.data);
    } catch (e) { console.error(e); }
  };
  useEffect(() => { load(); }, []);

  const save = async (status) => {
    if (!f.staffEmail || !f.reviewPeriod.trim()) { alert(t('ap.select_staff')); return; }
    const sp = staff.find(x => x.email === f.staffEmail);
    try {
      await api.post('/hr/appraisal', {
        staffEmail: f.staffEmail, staffName: sp ? sp.name : '', designation: sp ? sp.designation : '',
        department: sp ? sp.department : '', reviewPeriod: f.reviewPeriod,
        ratings: f.ratings, strengths: f.strengths, improvements: f.improvements, goals: f.goals,
        reviewedBy: me.name, status
      });
      setShowForm(false); load();
    } catch (e) { alert('Failed'); }
  };

  const ack = async (id) => {
    try { await api.patch(`/hr/appraisal/${id}/acknowledge`, { employeeComments: ackText }); setAckId(null); setAckText(''); load(); }
    catch (e) { alert('Failed'); }
  };

  const stars = (v) => '★'.repeat(Math.round(v)) + '☆'.repeat(5 - Math.round(v));
  const stColor = { draft: 'bg-gray-600', submitted: 'bg-blue-700', acknowledged: 'bg-green-700' };

  return (
    <div className="space-y-3">
      <h3 className="font-bold">⭐ {t('ap.title')} ({list.length})</h3>
      {mode === 'hr' && (
        <button onClick={() => setShowForm(!showForm)} className="w-full bg-teal-600 py-2 rounded-xl text-sm font-bold">{t('ap.new')}</button>
      )}
      {showForm && mode === 'hr' && (
        <div className="bg-gray-800 p-3 rounded-xl space-y-2">
          <select className="w-full bg-gray-700 p-2 rounded text-sm" value={f.staffEmail} onChange={e => setF({ ...f, staffEmail: e.target.value })}>
            <option value="">{t('ap.select_staff')}</option>
            {staff.map(s => <option key={s._id} value={s.email}>{s.name} ({s.designation})</option>)}
          </select>
          <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('ap.period')} value={f.reviewPeriod} onChange={e => setF({ ...f, reviewPeriod: e.target.value })} />
          {RKEYS.map(k => (
            <div key={k} className="flex items-center gap-2 text-xs">
              <span className="flex-1">{t('ap.' + k)}</span>
              <select className="bg-gray-700 p-1 rounded" value={f.ratings[k]} onChange={e => setF({ ...f, ratings: { ...f.ratings, [k]: Number(e.target.value) } })}>
                {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <span className="text-yellow-400 w-16">{stars(f.ratings[k])}</span>
            </div>
          ))}
          <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('ap.strengths')} value={f.strengths} onChange={e => setF({ ...f, strengths: e.target.value })} />
          <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('ap.improve')} value={f.improvements} onChange={e => setF({ ...f, improvements: e.target.value })} />
          <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('ap.goals')} value={f.goals} onChange={e => setF({ ...f, goals: e.target.value })} />
          <div className="flex gap-2">
            <button onClick={() => save('draft')} className="flex-1 bg-gray-600 py-2 rounded-xl text-sm font-bold">{t('ap.save_draft')}</button>
            <button onClick={() => save('submitted')} className="flex-1 bg-blue-600 py-2 rounded-xl text-sm font-bold">{t('ap.submit')}</button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {list.map(a => (
          <div key={a._id} className="bg-gray-800 p-3 rounded-xl text-xs">
            <div className="flex justify-between items-center">
              <div className="font-semibold text-sm">{mode === 'hr' ? a.staffName : a.reviewPeriod} <span className="text-gray-500 font-normal">{mode === 'hr' ? `(${a.reviewPeriod})` : ''}</span></div>
              <span className={`px-2 py-1 rounded font-bold ${stColor[a.status]}`}>{a.status.toUpperCase()}</span>
            </div>
            <div className="mt-1 text-yellow-400 font-bold">{stars(a.overallScore)} <span className="text-gray-400">{a.overallScore}/5</span></div>
            <div className="grid grid-cols-2 gap-1 mt-1 text-gray-400">
              {RKEYS.map(k => <div key={k}>{t('ap.' + k)}: <b className="text-gray-200">{a.ratings[k]}/5</b></div>)}
            </div>
            {a.strengths && <div className="text-gray-500 mt-1">+ {a.strengths}</div>}
            {a.improvements && <div className="text-gray-500">- {a.improvements}</div>}
            {a.goals && <div className="text-gray-500">🎯 {a.goals}</div>}
            <div className="text-gray-600 mt-1">{t('ap.reviewed_by')}: {a.reviewedBy}</div>
            {a.employeeComments && <div className="text-blue-300 mt-1">💬 {a.employeeComments}</div>}
            {mode === 'staff' && a.status === 'submitted' && ackId !== a._id && (
              <button onClick={() => setAckId(a._id)} className="mt-2 bg-green-600 px-3 py-1 rounded font-bold">{t('ap.ack')}</button>
            )}
            {ackId === a._id && (
              <div className="mt-2 space-y-2">
                <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('ap.my_comments')} value={ackText} onChange={e => setAckText(e.target.value)} />
                <button onClick={() => ack(a._id)} className="w-full bg-green-600 py-1 rounded font-bold">{t('ap.ack')}</button>
              </div>
            )}
          </div>
        ))}
        {list.length === 0 && <p className="text-gray-500 text-xs">{t('ap.no_ap')}</p>}
      </div>
    </div>
  );
}
