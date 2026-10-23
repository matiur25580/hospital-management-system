import { useEffect, useState } from 'react';
import api from '../api';
import { useLang } from '../i18n/LanguageContext.jsx';

const LEVEL_TITLES = {
  1: '👑 Owner', 2: 'Top Management', 3: 'Hospital Heads',
  4: 'Managers', 5: 'Shift Control (DM)', 6: 'Doctors • Nurses • Staff'
};

export default function OrgHierarchy() {
  const { t } = useLang();
  const [levels, setLevels] = useState({});
  const [open, setOpen] = useState(null);

  const load = async () => {
    try { const { data } = await api.get('/staff/hierarchy'); setLevels(data); }
    catch (e) { console.error(e); }
  };
  useEffect(() => { load(); }, []);

  const seedMgmt = async () => {
    try { const { data } = await api.post('/staff/seed-management'); alert('Management seeded: ' + data.created); load(); }
    catch (e) { alert('Failed: ' + (e.response?.data?.message || e.message)); }
  };
  const syncUsers = async () => {
    try { const { data } = await api.post('/staff/sync-users'); alert('Staff synced: ' + data.created); load(); }
    catch (e) { alert('Failed: ' + (e.response?.data?.message || e.message)); }
  };

  const total = Object.values(levels).reduce((s, arr) => s + arr.length, 0);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-bold">🏛️ {t('hr.hierarchy')} ({total})</h3>
      </div>
      {total === 0 && (
        <div className="flex gap-2">
          <button onClick={seedMgmt} className="flex-1 bg-teal-600 py-2 rounded-xl text-sm font-bold">{t('hr.seed_mgmt')}</button>
          <button onClick={syncUsers} className="flex-1 bg-blue-600 py-2 rounded-xl text-sm font-bold">{t('hr.sync')}</button>
        </div>
      )}
      {total > 0 && (
        <div className="flex gap-2">
          <button onClick={syncUsers} className="flex-1 bg-gray-700 py-1 rounded text-xs">{t('hr.sync')}</button>
        </div>
      )}
      {Object.keys(levels).sort((a, b) => a - b).map(lv => (
        <div key={lv} className="space-y-2">
          <div className="text-xs font-bold text-yellow-400 border-b border-gray-700 pb-1">
            {LEVEL_TITLES[lv] || ('Level ' + lv)} ({levels[lv].length})
          </div>
          {levels[lv].map(p => (
            <div key={p._id} className="bg-gray-800 rounded-xl overflow-hidden">
              <button onClick={() => setOpen(open === p._id ? null : p._id)} className="w-full p-3 flex justify-between items-center text-left">
                <div>
                  <div className="font-semibold text-sm">{p.name}</div>
                  <div className="text-xs text-gray-500">{p.designation}{p.department ? ' • ' + p.department : ''}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-1 rounded font-bold ${p.employmentType === 'government' ? 'bg-orange-700' : 'bg-purple-700'}`}>
                    {p.employmentType === 'government' ? t('hr.govt') : t('hr.private')}
                  </span>
                  <span className="text-gray-500 text-xs">{open === p._id ? '▲' : '▼'}</span>
                </div>
              </button>
              {open === p._id && (
                <div className="px-3 pb-3 text-xs space-y-1">
                  <div><span className="font-bold">{t('hr.designation')}:</span> {p.designation}</div>
                  <div><span className="font-bold">{t('hr.reports_to')}:</span> {p.reportingTo}</div>
                  <div><span className="font-bold">{t('hr.emp_type')}:</span> {p.employmentType === 'government' ? t('hr.govt') : t('hr.private')}
                    {p.basicPay > 0 ? <span> • {t('hr.basic')}: Rs. {Number(p.basicPay).toLocaleString()}</span> : <span className="text-gray-500"> • {t('hr.honorary')}</span>}
                  </div>
                  <div><span className="font-bold">{t('hr.functions')}:</span>
                    <ul className="list-disc ml-4 text-gray-400">{(p.functions || []).map((fn, i) => <li key={i}>{fn}</li>)}</ul>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
