import { useEffect, useState } from 'react';
import api from '../api';
import { useLang } from '../i18n/LanguageContext.jsx';

function HBar({ label, value, max, color }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-24 truncate text-gray-400">{label}</span>
      <div className="flex-1 bg-gray-700 rounded h-4 overflow-hidden">
        <div className={`h-4 rounded ${color}`} style={{ width: (max ? (value / max) * 100 : 0) + '%' }} />
      </div>
      <span className="w-10 text-right font-semibold">{value}</span>
    </div>
  );
}

export default function Analytics() {
  const { t } = useLang();
  const [d, setD] = useState(null);
  useEffect(() => { api.get('/analytics/overview').then(r => setD(r.data)).catch(e => console.error(e)); }, []);
  if (!d) return <p className="text-gray-500 text-sm">{t('common.loading')}</p>;

  const maxRev = Math.max(1, ...d.monthlyRevenue.map(x => x.billed));
  const maxCases = Math.max(1, ...d.monthlyCases.map(x => x.count));
  const maxDis = Math.max(1, ...d.topDiseases.map(x => x.count));
  const maxDoc = Math.max(1, ...d.doctorLoad.map(x => x.count));
  const occPct = d.beds.total ? Math.round((d.beds.occupied / d.beds.total) * 100) : 0;
  const stColor = { paid: 'bg-green-700', partial: 'bg-yellow-700', unpaid: 'bg-red-700' };

  return (
    <div className="space-y-4">
      <h3 className="font-bold">{t('ana.title')}</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800 p-3 rounded-xl">
          <div className="text-gray-500 text-xs">{t('ana.billed')}</div>
          <div className="text-xl font-bold">Rs. {d.revenue.billed}</div>
        </div>
        <div className="bg-gray-800 p-3 rounded-xl">
          <div className="text-gray-500 text-xs">{t('ana.collected')}</div>
          <div className="text-xl font-bold text-green-400">Rs. {d.revenue.collected}</div>
        </div>
        <div className="bg-gray-800 p-3 rounded-xl">
          <div className="text-gray-500 text-xs">{t('ana.due')}</div>
          <div className="text-xl font-bold text-red-400">Rs. {d.revenue.due}</div>
        </div>
        <div className="bg-gray-800 p-3 rounded-xl">
          <div className="text-gray-500 text-xs">{t('ana.occupancy')}</div>
          <div className="text-xl font-bold">{occPct}% <span className="text-xs text-gray-500 font-normal">({d.beds.occupied}/{d.beds.total})</span></div>
        </div>
      </div>
      <div className="bg-gray-800 p-3 rounded-xl">
        <div className="text-sm font-bold mb-2">{t('ana.revenue')}</div>
        <div className="flex items-end gap-2 h-32">
          {d.monthlyRevenue.map(x => (
            <div key={x.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <div className="w-full flex items-end gap-0.5 h-24">
                <div className="flex-1 bg-teal-500 rounded-t" style={{ height: (x.billed / maxRev) * 100 + '%' }} title={'Billed Rs. ' + x.billed} />
                <div className="flex-1 bg-green-400 rounded-t" style={{ height: (x.collected / maxRev) * 100 + '%' }} title={'Collected Rs. ' + x.collected} />
              </div>
              <span className="text-[10px] text-gray-500">{x.month}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-gray-800 p-3 rounded-xl">
        <div className="text-sm font-bold mb-2">{t('ana.inflow')}</div>
        <div className="flex items-end gap-2 h-28">
          {d.monthlyCases.map(x => (
            <div key={x.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <div className="w-2/3 bg-blue-500 rounded-t" style={{ height: (x.count / maxCases) * 100 + '%' }} title={x.count + ' cases'} />
              <span className="text-[10px] text-gray-500">{x.month}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-gray-800 p-3 rounded-xl space-y-2">
        <div className="text-sm font-bold">{t('ana.diseases')}</div>
        {d.topDiseases.map(x => <HBar key={x.disease} label={x.disease} value={x.count} max={maxDis} color="bg-purple-500" />)}
        {d.topDiseases.length === 0 && <p className="text-gray-500 text-xs">{t('ana.no_data')}</p>}
      </div>
      {d.doctorLoad.length > 0 && (
        <div className="bg-gray-800 p-3 rounded-xl space-y-2">
          <div className="text-sm font-bold">{t('ana.doctors')}</div>
          {d.doctorLoad.map(x => <HBar key={x.doctor} label={x.doctor} value={x.count} max={maxDoc} color="bg-orange-500" />)}
        </div>
      )}
      <div className="bg-gray-800 p-3 rounded-xl">
        <div className="text-sm font-bold mb-2">{t('ana.paystatus')}</div>
        <div className="flex gap-2 flex-wrap">
          {d.paymentStatus.map(p => (
            <span key={p.status} className={`text-xs px-3 py-1 rounded-full font-bold ${stColor[p.status] || 'bg-gray-600'}`}>
              {p.status.toUpperCase()}: {p.count} (Rs. {p.total})
            </span>
          ))}
          {d.paymentStatus.length === 0 && <p className="text-gray-500 text-xs">{t('ana.no_data')}</p>}
        </div>
      </div>
    </div>
  );
}
