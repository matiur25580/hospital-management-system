import { useEffect, useState } from 'react';
import api from '../api';
import { useLang } from '../i18n/LanguageContext.jsx';

const emptyCat = { code: '', name: '', category: '', price: '', sampleType: '', normalRange: '', tatHours: '' };

export default function LabManagement({ mode }) {
  const { t } = useLang();
  const [tab, setTab] = useState('orders');
  const [catalog, setCatalog] = useState([]);
  const [orders, setOrders] = useState([]);
  const [me, setMe] = useState({ email: '', name: '' });
  const [showOrder, setShowOrder] = useState(false);
  const [of, setOf] = useState({ patientName: '', patientEmail: '', selected: [] });
  const [showCat, setShowCat] = useState(false);
  const [cf, setCf] = useState(emptyCat);
  const [repId, setRepId] = useState(null);
  const [repVals, setRepVals] = useState({});

  const load = async () => {
    try {
      const [c, m] = await Promise.all([api.get('/lab/catalog'), api.get('/auth/me')]);
      setCatalog(c.data);
      const email = m.data.email || '';
      setMe({ email, name: m.data.name || '' });
      let url = '/lab/orders';
      if (mode === 'patient') url += '?patientEmail=' + encodeURIComponent(email);
      const o = await api.get(url);
      setOrders(o.data);
    } catch (e) { console.error(e); }
  };
  useEffect(() => { load(); }, []);

  const toggleSel = (code) => {
    setOf({ ...of, selected: of.selected.includes(code) ? of.selected.filter(x => x !== code) : [...of.selected, code] });
  };

  const selTotal = of.selected.reduce((s, code) => {
    const tc = catalog.find(x => x.code === code);
    return s + (tc ? tc.price : 0);
  }, 0);

  const createOrder = async () => {
    if (!of.patientName.trim() || of.selected.length === 0) { alert(t('lab.select')); return; }
    const tests = of.selected.map(code => {
      const tc = catalog.find(x => x.code === code);
      return { code: tc.code, name: tc.name, price: tc.price, normalRange: tc.normalRange };
    });
    try {
      await api.post('/lab/orders', {
        patientName: of.patientName, patientEmail: of.patientEmail,
        tests, totalAmount: selTotal, orderedBy: me.name
      });
      setOf({ patientName: '', patientEmail: '', selected: [] });
      setShowOrder(false); load();
    } catch (e) { alert('Failed'); }
  };

  const addCatalog = async () => {
    if (!cf.code.trim() || !cf.name.trim()) { alert(t('lab.test_name')); return; }
    try {
      await api.post('/lab/catalog', { ...cf, code: cf.code.toUpperCase(), price: Number(cf.price) || 0, tatHours: Number(cf.tatHours) || 4 });
      setCf(emptyCat); setShowCat(false); load();
    } catch (e) { alert('Failed: ' + (e.response?.data?.message || e.message)); }
  };

  const collect = async (id) => {
    try { await api.patch(`/lab/orders/${id}/collect`, { collectedBy: me.name }); load(); }
    catch (e) { alert('Failed'); }
  };

  const openReport = (o) => {
    const init = {};
    o.tests.forEach(tc => { init[tc.code] = { result: tc.result || '', flag: tc.flag || 'normal' }; });
    setRepVals(init); setRepId(repId === o._id ? null : o._id);
  };

  const submitReport = async (o) => {
    const results = o.tests.map(tc => ({ code: tc.code, result: (repVals[tc.code] || {}).result || '', flag: (repVals[tc.code] || {}).flag || 'normal' }));
    try {
      await api.patch(`/lab/orders/${o._id}/report`, { results, reportedBy: me.name });
      setRepId(null); setRepVals({}); load();
    } catch (e) { alert('Failed'); }
  };

  const stColor = { ordered: 'bg-yellow-700', 'sample-collected': 'bg-blue-700', 'in-progress': 'bg-purple-700', reported: 'bg-green-700' };
  const flagColor = { normal: 'text-green-400', high: 'text-red-400', low: 'text-yellow-400' };
  const canOrder = mode === 'admin' || mode === 'doctor';
  const canProcess = mode === 'admin' || mode === 'staff';

  if (mode === 'patient') {
    const done = orders.filter(o => o.status === 'reported');
    return (
      <div className="space-y-3">
        <h3 className="font-bold">🧪 {t('lab.my_reports')} ({done.length})</h3>
        {done.map(o => (
          <div key={o._id} className="bg-gray-800 p-3 rounded-xl text-xs">
            <div className="font-bold text-sm mb-2">{new Date(o.orderDate).toLocaleDateString()} • {t('lab.ordered_by')}: {o.orderedBy}</div>
            {o.tests.map(tc => (
              <div key={tc.code} className="flex justify-between bg-gray-700 p-2 rounded mb-1">
                <div><div className="font-semibold">{tc.name}</div><div className="text-gray-500">{t('lab.range')}: {tc.normalRange}</div></div>
                <div className="text-right"><div className={`font-bold ${flagColor[tc.flag] || ''}`}>{tc.result}</div><div className="text-gray-500">{tc.flag}</div></div>
              </div>
            ))}
          </div>
        ))}
        {done.length === 0 && <p className="text-gray-500 text-xs">{t('lab.no_orders')}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-bold">🧪 {t('lab.title')}</h3>
      <div className="flex gap-2">
        <button onClick={() => setTab('orders')} className={`flex-1 py-1 rounded text-sm font-bold ${tab === 'orders' ? 'bg-blue-600' : 'bg-gray-700'}`}>{t('lab.orders')} ({orders.length})</button>
        {mode === 'admin' && (
          <button onClick={() => setTab('catalog')} className={`flex-1 py-1 rounded text-sm font-bold ${tab === 'catalog' ? 'bg-blue-600' : 'bg-gray-700'}`}>{t('lab.catalog')} ({catalog.length})</button>
        )}
      </div>

      {tab === 'catalog' && mode === 'admin' && (
        <div className="space-y-2">
          <button onClick={() => setShowCat(!showCat)} className="w-full bg-teal-600 py-2 rounded-xl text-sm font-bold">{t('lab.add_test')}</button>
          {showCat && (
            <div className="bg-gray-800 p-3 rounded-xl space-y-2">
              <div className="flex gap-2">
                <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('lab.code') + ' *'} value={cf.code} onChange={e => setCf({ ...cf, code: e.target.value })} />
                <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('lab.price') + ' *'} type="number" value={cf.price} onChange={e => setCf({ ...cf, price: e.target.value })} />
              </div>
              <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('lab.test_name') + ' *'} value={cf.name} onChange={e => setCf({ ...cf, name: e.target.value })} />
              <div className="flex gap-2">
                <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('lab.category')} value={cf.category} onChange={e => setCf({ ...cf, category: e.target.value })} />
                <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('lab.sample')} value={cf.sampleType} onChange={e => setCf({ ...cf, sampleType: e.target.value })} />
              </div>
              <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('lab.range')} value={cf.normalRange} onChange={e => setCf({ ...cf, normalRange: e.target.value })} />
              <button onClick={addCatalog} className="w-full bg-blue-600 py-2 rounded-xl text-sm font-bold">{t('common.save')}</button>
            </div>
          )}
          {catalog.map(tc => (
            <div key={tc._id} className="bg-gray-800 p-2 rounded-xl text-xs flex justify-between">
              <div><span className="font-bold">{tc.code}</span> • {tc.name} <span className="text-gray-500">({tc.category})</span></div>
              <div className="font-bold text-green-400">Rs. {tc.price}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'orders' && (
        <div className="space-y-2">
          {canOrder && (
            <button onClick={() => setShowOrder(!showOrder)} className="w-full bg-teal-600 py-2 rounded-xl text-sm font-bold">{t('lab.order')}</button>
          )}
          {showOrder && (
            <div className="bg-gray-800 p-3 rounded-xl space-y-2">
              <div className="flex gap-2">
                <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('common.name') + ' *'} value={of.patientName} onChange={e => setOf({ ...of, patientName: e.target.value })} />
                <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('common.email')} value={of.patientEmail} onChange={e => setOf({ ...of, patientEmail: e.target.value })} />
              </div>
              <div className="text-xs font-bold text-gray-400">{t('lab.select')}:</div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {catalog.map(tc => (
                  <label key={tc.code} className="flex justify-between bg-gray-700 p-2 rounded text-xs cursor-pointer">
                    <span><input type="checkbox" checked={of.selected.includes(tc.code)} onChange={() => toggleSel(tc.code)} className="mr-2" />{tc.name}</span>
                    <span className="font-bold">Rs. {tc.price}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-between font-bold text-sm"><span>{t('lab.total')}:</span><span>Rs. {selTotal}</span></div>
              <button onClick={createOrder} className="w-full bg-blue-600 py-2 rounded-xl text-sm font-bold">{t('common.save')}</button>
            </div>
          )}
          {orders.map(o => (
            <div key={o._id} className="bg-gray-800 p-3 rounded-xl text-xs">
              <div className="flex justify-between items-center">
                <div className="font-semibold text-sm">{o.patientName}</div>
                <span className={`px-2 py-1 rounded font-bold ${stColor[o.status]}`}>{o.status.toUpperCase()}</span>
              </div>
              <div className="text-gray-500 mt-1">{o.tests.map(tc => tc.name).join(', ')}</div>
              <div className="text-gray-500">{t('lab.total')}: Rs. {o.totalAmount} • {t('lab.ordered_by')}: {o.orderedBy}</div>
              {o.status === 'ordered' && canProcess && (
                <button onClick={() => collect(o._id)} className="mt-2 bg-blue-600 px-3 py-1 rounded font-bold">{t('lab.collect')}</button>
              )}
              {o.status !== 'ordered' && o.status !== 'reported' && canProcess && (
                <button onClick={() => openReport(o)} className="mt-2 bg-purple-600 px-3 py-1 rounded font-bold">{t('lab.results')}</button>
              )}
              {repId === o._id && (
                <div className="mt-2 space-y-2">
                  {o.tests.map(tc => (
                    <div key={tc.code} className="flex gap-2 items-center">
                      <span className="flex-1 font-semibold">{tc.name}</span>
                      <input className="flex-1 bg-gray-700 p-1 rounded text-sm" placeholder={t('lab.result')}
                        value={(repVals[tc.code] || {}).result || ''}
                        onChange={e => setRepVals({ ...repVals, [tc.code]: { ...(repVals[tc.code] || {}), result: e.target.value } })} />
                      <select className="bg-gray-700 p-1 rounded text-sm"
                        value={(repVals[tc.code] || {}).flag || 'normal'}
                        onChange={e => setRepVals({ ...repVals, [tc.code]: { ...(repVals[tc.code] || {}), flag: e.target.value } })}>
                        <option value="normal">Normal</option><option value="high">High</option><option value="low">Low</option>
                      </select>
                    </div>
                  ))}
                  <button onClick={() => submitReport(o)} className="w-full bg-green-600 py-1 rounded font-bold">{t('lab.save_results')}</button>
                </div>
              )}
              {o.status === 'reported' && (
                <div className="mt-2 space-y-1">
                  {o.tests.map(tc => (
                    <div key={tc.code} className="flex justify-between bg-gray-700 p-2 rounded">
                      <span>{tc.name}</span>
                      <span className={`font-bold ${flagColor[tc.flag] || ''}`}>{tc.result} ({tc.flag})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {orders.length === 0 && <p className="text-gray-500 text-xs">{t('lab.no_orders')}</p>}
        </div>
      )}
    </div>
  );
}
