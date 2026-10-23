import { useEffect, useState } from 'react';
import api from '../api';
import { useLang } from '../i18n/LanguageContext.jsx';

const todayLocal = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

export default function DutyRoster({ mode }) {
  const { t } = useLang();
  const [date, setDate] = useState(todayLocal());
  const [roster, setRoster] = useState([]);
  const [tab, setTab] = useState('morning');

  const load = async (d) => {
    try { const { data } = await api.get(`/roster?date=${d}`); setRoster(data); }
    catch (e) { console.error(e); }
  };

  useEffect(() => {
    load(date);
    if (date === todayLocal()) {
      const hm = new Date().getHours() * 60 + new Date().getMinutes();
      setTab(hm >= 7 * 60 && hm < 14 * 60 ? 'morning' : hm >= 14 * 60 && hm < 21 * 60 ? 'evening' : 'night');
    }
  }, [date]);

  const generate = async () => {
    try { const { data } = await api.post('/roster/generate', { date }); alert('Roster generated: ' + data.count + ' entries'); load(date); }
    catch (e) { alert('Failed: ' + (e.response?.data?.message || e.message)); }
  };

  const shifts = ['morning', 'evening', 'night'];
  const isToday = date === todayLocal();
  const hm = new Date().getHours() * 60 + new Date().getMinutes();
  const curShift = hm >= 7 * 60 && hm < 14 * 60 ? 'morning' : hm >= 14 * 60 && hm < 21 * 60 ? 'evening' : 'night';

  const list = roster.filter(x => x.shift === tab);
  const byRole = {};
  list.forEach(x => { (byRole[x.role] = byRole[x.role] || []).push(x); });

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-bold">📋 {t('roster.title')}</h3>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-gray-700 p-1 rounded text-sm" />
      </div>
      {roster.length === 0 && mode === 'admin' && (
        <button onClick={generate} className="w-full bg-teal-600 py-2 rounded-xl text-sm font-bold">{t('roster.generate')}</button>
      )}
      {roster.length === 0 && mode !== 'admin' && (
        <p className="text-gray-500 text-xs">{t('roster.empty')}</p>
      )}
      {roster.length > 0 && (
        <>
          <div className="flex gap-2">
            {shifts.map(s => (
              <button key={s} onClick={() => setTab(s)}
                className={`flex-1 py-1 rounded text-sm font-bold relative ${tab === s ? 'bg-blue-600' : 'bg-gray-700'}`}>
                {t('roster.' + s)}
                <span className="text-xs opacity-70"> ({roster.filter(x => x.shift === s).length})</span>
                {isToday && curShift === s && (
                  <span className="absolute -top-2 -right-1 text-[9px] bg-green-600 px-1 rounded font-bold">{t('roster.now')}</span>
                )}
              </button>
            ))}
          </div>
          {Object.keys(byRole).map(role => (
            <div key={role} className="space-y-1">
              <div className="text-xs font-bold text-gray-400">{role}s ({byRole[role].length})</div>
              {byRole[role].map(x => (
                <div key={x._id} className="bg-gray-800 p-2 rounded-xl text-xs flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-sm">{x.staffName}</div>
                    <div className="text-gray-500">{x.department}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{x.startTime} - {x.endTime}</div>
                    <div className="text-gray-500">{x.hours} {t('roster.hours')}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
