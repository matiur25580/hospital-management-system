import { useEffect, useState } from 'react';
import api from '../api';
import { useLang } from '../i18n/LanguageContext.jsx';

const CATS = ['cleanliness', 'staff', 'doctor', 'waiting', 'overall'];
const KEYMAP = { cleanliness: 'cleanliness', staff: 'staffBehavior', doctor: 'doctorCare', waiting: 'waitingTime', overall: 'overall' };

const StarInput = ({ value, onChange }) => (
  <span>{[1, 2, 3, 4, 5].map(v => (
    <span key={v} onClick={() => onChange(v)} style={{ cursor: 'pointer', fontSize: 24, color: v <= value ? '#ffc107' : '#555' }}>★</span>
  ))}</span>
);
const Stars = ({ v }) => <span style={{ color: '#ffc107' }}>{'★'.repeat(Math.round(v || 0))}<span style={{ color: '#555' }}>{'★'.repeat(5 - Math.round(v || 0))}</span></span>;

export default function Feedback({ mode }) {
  const { t } = useLang();
  const [tab, setTab] = useState('summary');
  const [summary, setSummary] = useState(null);
  const [list, setList] = useState([]);
  const [depts, setDepts] = useState([]);
  const [me, setMe] = useState({ email: '', name: '' });
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState({ department: '', doctorName: '', ratings: { cleanliness: 5, staffBehavior: 5, doctorCare: 5, waitingTime: 5, overall: 5 }, comments: '' });

  const load = async () => {
    try {
      const m = await api.get('/auth/me');
      setMe({ email: m.data.email || '', name: m.data.name || '' });
      if (mode === 'admin') {
        const [sm, fb, dp] = await Promise.all([api.get('/feedback/summary'), api.get('/feedback'), api.get('/departments')]);
        setSummary(sm.data); setList(fb.data); setDepts(dp.data);
      }
    } catch (e) { console.error(e); }
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    try {
      await api.post('/feedback', {
        patientName: me.name, patientEmail: me.email,
        department: f.department, doctorName: f.doctorName,
        ratings: f.ratings, comments: f.comments
      });
      setShowForm(false);
      setF({ department: '', doctorName: '', ratings: { cleanliness: 5, staffBehavior: 5, doctorCare: 5, waitingTime: 5, overall: 5 }, comments: '' });
      alert(t('fb.thanks'));
    } catch (e) { alert('Failed'); }
  };

  const markReviewed = async (id) => {
    try { await api.patch(`/feedback/${id}`, { status: 'reviewed' }); load(); }
    catch (e) { alert('Failed'); }
  };

  if (mode === 'patient') {
    return (
      <div className="space-y-3">
        <h3 className="font-bold">⭐ {t('fb.title')}</h3>
        <button onClick={() => setShowForm(!showForm)} className="w-full bg-teal-600 py-2 rounded-xl text-sm font-bold">{t('fb.give')}</button>
        {showForm && (
          <div className="bg-gray-800 p-3 rounded-xl space-y-2">
            <div className="flex gap-2">
              <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('hr.dept')} value={f.department} onChange={e => setF({ ...f, department: e.target.value })} />
              <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('fb.doctor')} value={f.doctorName} onChange={e => setF({ ...f, doctorName: e.target.value })} />
            </div>
            {CATS.map(c => (
              <div key={c} className="flex justify-between items-center text-xs">
                <span>{t('fb.' + c)}</span>
                <StarInput value={f.ratings[KEYMAP[c]]} onChange={v => setF({ ...f, ratings: { ...f.ratings, [KEYMAP[c]]: v } })} />
              </div>
            ))}
            <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('fb.comments')} value={f.comments} onChange={e => setF({ ...f, comments: e.target.value })} />
            <button onClick={submit} className="w-full bg-blue-600 py-2 rounded-xl text-sm font-bold">{t('fb.submit')}</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-bold">⭐ {t('fb.title')}</h3>
      <div className="flex gap-2">
        <button onClick={() => setTab('summary')} className={`flex-1 py-1 rounded text-sm font-bold ${tab === 'summary' ? 'bg-blue-600' : 'bg-gray-700'}`}>{t('fb.total')}: {summary ? summary.total : 0}</button>
        <button onClick={() => setTab('list')} className={`flex-1 py-1 rounded text-sm font-bold ${tab === 'list' ? 'bg-blue-600' : 'bg-gray-700'}`}>{t('fb.pending')}: {summary ? summary.pending : 0}</button>
      </div>
      {tab === 'summary' && summary && (
        <div className="space-y-2">
          <div className="bg-gray-800 p-3 rounded-xl grid grid-cols-2 gap-2 text-xs">
            {CATS.map(c => (
              <div key={c} className="flex justify-between"><span className="text-gray-400">{t('fb.' + c)}</span><span><Stars v={summary.avg[KEYMAP[c]]} /> <b>{summary.avg[KEYMAP[c]]}</b></span></div>
            ))}
          </div>
          <div className="text-xs font-bold text-gray-400">{t('fb.by_dept')}</div>
          {summary.byDept.map(d => (
            <div key={d.department} className="bg-gray-800 p-2 rounded-xl text-xs flex justify-between">
              <span className="font-semibold">{d.department} <span className="text-gray-500">({d.count})</span></span>
              <span><Stars v={d.avg} /> <b>{d.avg}</b></span>
            </div>
          ))}
        </div>
      )}
      {tab === 'list' && (
        <div className="space-y-2">
          {list.map(fb => (
            <div key={fb._id} className="bg-gray-800 p-3 rounded-xl text-xs">
              <div className="flex justify-between items-center">
                <div className="font-semibold text-sm">{fb.patientName} <span className="text-gray-500 font-normal">({fb.department})</span></div>
                {fb.status === 'new'
                  ? <button onClick={() => markReviewed(fb._id)} className="text-xs bg-blue-600 px-2 py-1 rounded font-bold">{t('fb.mark')}</button>
                  : <span className="text-xs text-green-400 font-bold">✓</span>}
              </div>
              <div className="mt-1"><Stars v={fb.ratings.overall} /> <b>{fb.ratings.overall}/5</b> <span className="text-gray-500">C:{fb.ratings.cleanliness} S:{fb.ratings.staffBehavior} D:{fb.ratings.doctorCare} W:{fb.ratings.waitingTime}</span></div>
              {fb.comments && <div className="text-gray-400 mt-1">💬 {fb.comments}</div>}
              <div className="text-gray-600">{new Date(fb.submittedDate).toLocaleDateString()}</div>
            </div>
          ))}
          {list.length === 0 && <p className="text-gray-500 text-xs">{t('fb.no_fb')}</p>}
        </div>
      )}
    </div>
  );
}
