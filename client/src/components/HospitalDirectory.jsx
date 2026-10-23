import { useEffect, useState } from 'react';
import api from '../api';
import { useLang } from '../i18n/LanguageContext.jsx';

const ALL_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

export default function HospitalDirectory() {
  const { t } = useLang();
  const [depts, setDepts] = useState([]);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);

  useEffect(() => {
    api.get('/departments').then(r => setDepts(r.data)).catch(e => console.error(e));
  }, []);

  const filtered = depts.filter(d => {
    const s = q.trim().toLowerCase();
    return !s || d.name.toLowerCase().includes(s) || d.code.toLowerCase().includes(s) ||
      (d.doctors || []).some(doc => doc.name.toLowerCase().includes(s));
  });

  return (
    <div className="space-y-3">
      <h3 className="font-bold">🏥 {t('dir.title')} ({depts.length})</h3>
      <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('dir.search')}
        value={q} onChange={e => setQ(e.target.value)} />
      <div className="space-y-2">
        {filtered.map(d => (
          <div key={d.code} className="bg-gray-800 rounded-xl overflow-hidden">
            <button onClick={() => setOpen(open === d.code ? null : d.code)}
              className="w-full p-3 flex justify-between items-center text-left">
              <div>
                <div className="font-semibold text-sm">{d.name}</div>
                <div className="text-xs text-gray-500">{d.floor} • {t('dir.rooms')}: {(d.opdRooms || []).join(', ')}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-blue-700 px-2 py-1 rounded font-bold">{d.code}</span>
                <span className="text-gray-500">{open === d.code ? '▲' : '▼'}</span>
              </div>
            </button>
            {open === d.code && (
              <div className="px-3 pb-3 space-y-2 text-xs">
                <p className="text-gray-400">{d.description}</p>
                <div><span className="font-bold">{t('dir.hod')}: </span>{d.hod}</div>
                <div>
                  <div className="font-bold mb-1">{t('dir.opd_days')}</div>
                  <div className="flex gap-1 flex-wrap">
                    {ALL_DAYS.map(day => (
                      <span key={day}
                        className={`px-2 py-1 rounded ${d.opdDays.includes(day) ? 'bg-green-700 font-bold' : 'bg-gray-700 text-gray-500'}`}>
                        {day.slice(0, 3)}
                      </span>
                    ))}
                  </div>
                </div>
                <div><span className="font-bold">{t('dir.timing')}: </span>{(d.sessions || []).join(' | ')}</div>
                {d.scheduleNote && <div className="text-yellow-400">⚠ {d.scheduleNote}</div>}
                <div>
                  <div className="font-bold mb-1">{t('dir.doctors')} ({(d.doctors || []).length}) • {t('dir.nurses')}: {d.nurseCount}</div>
                  {(d.doctors || []).map(doc => (
                    <div key={doc.email} className="bg-gray-700 p-2 rounded mb-1">
                      <div className="font-semibold">{doc.name}</div>
                      <div className="text-gray-400">{doc.designation} • {doc.qualification}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-gray-500 text-xs">{t('ana.no_data')}</p>}
    </div>
  );
}
