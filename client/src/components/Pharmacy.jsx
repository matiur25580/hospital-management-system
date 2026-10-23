import { useEffect, useState } from 'react';
import api from '../api';
import { useLang } from '../i18n/LanguageContext.jsx';

const emptyForm = { name: '', genericName: '', batchNo: '', quantity: '', unit: 'tablet', price: '', expiryDate: '', minStock: '10', supplier: '' };

export default function Pharmacy({ mode, userName }) {
  const { t } = useLang();
  const [meds, setMeds] = useState([]);
  const [q, setQ] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [disId, setDisId] = useState(null);
  const [df, setDf] = useState({ patientName: '', patientEmail: '', quantity: '' });
  const [hist, setHist] = useState([]);
  const [showHist, setShowHist] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/pharmacy' + (q ? `?q=${encodeURIComponent(q)}` : ''));
      setMeds(data);
    } catch (e) { console.error(e); }
  };
  useEffect(() => { load(); }, []);

  const addMed = async () => {
    if (!form.name.trim()) { alert(t('ph.name')); return; }
    try {
      await api.post('/pharmacy', { ...form, quantity: Number(form.quantity) || 0, price: Number(form.price) || 0, minStock: Number(form.minStock) || 10, expiryDate: form.expiryDate || undefined });
      setForm(emptyForm); setShowAdd(false); load();
    } catch (e) { alert('Failed: ' + (e.response?.data?.message || e.message)); }
  };

  const adjust = async (id, delta) => {
    const med = meds.find(m => m._id === id);
    try { await api.patch(`/pharmacy/${id}`, { quantity: Math.max(0, med.quantity + delta) }); load(); }
    catch (e) { alert('Failed'); }
  };

  const remove = async (id) => {
    if (!confirm(t('ph.name') + '?')) return;
    try { await api.delete(`/pharmacy/${id}`); load(); } catch (e) { alert('Failed'); }
  };

  const dispense = async (id) => {
    const qty = Number(df.quantity) || 0;
    if (!df.patientName.trim() || qty <= 0) { alert(t('ph.patient')); return; }
    try {
      await api.post(`/pharmacy/${id}/dispense`, { ...df, quantity: qty, dispensedBy: userName });
      setDisId(null); setDf({ patientName: '', patientEmail: '', quantity: '' });
      load();
    } catch (e) { alert('Failed: ' + (e.response?.data?.message || e.message)); }
  };

  const loadHist = async () => {
    try { const { data } = await api.get('/pharmacy/dispensed'); setHist(data); setShowHist(!showHist); }
    catch (e) { console.error(e); }
  };

  const lowCount = meds.filter(m => m.quantity <= m.minStock).length;
  const expInfo = (m) => {
    if (!m.expiryDate) return null;
    const days = Math.ceil((new Date(m.expiryDate) - new Date()) / 86400000);
    if (days < 0) return { t: t('ph.expired'), c: 'bg-red-700' };
    if (days <= 30) return { t: days + t('ph.dleft'), c: 'bg-yellow-700' };
    return null;
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-bold">{t('ph.title')}</h3>
        <button onClick={loadHist} className="text-xs bg-gray-700 px-3 py-1 rounded">{t('common.history')}</button>
      </div>
      {lowCount > 0 && (
        <div className="bg-red-900 border border-red-700 p-2 rounded-xl text-xs font-bold text-red-200">
          ⚠ {lowCount} {t('ph.warn')}
        </div>
      )}
      <div className="flex gap-2">
        <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('ph.search')}
          value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} />
        <button onClick={load} className="bg-gray-700 px-4 rounded text-sm">🔍</button>
      </div>
      {mode === 'admin' && (
        <button onClick={() => setShowAdd(!showAdd)} className="w-full bg-teal-600 py-2 rounded-xl text-sm font-bold">{t('ph.add')}</button>
      )}
      {showAdd && (
        <div className="bg-gray-800 p-3 rounded-xl space-y-2">
          <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('ph.name') + ' *'} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('ph.generic')} value={form.genericName} onChange={e => setForm({ ...form, genericName: e.target.value })} />
          <div className="flex gap-2">
            <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('ph.batch')} value={form.batchNo} onChange={e => setForm({ ...form, batchNo: e.target.value })} />
            <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('ph.qty')} type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <select className="flex-1 bg-gray-700 p-2 rounded text-sm" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
              <option value="tablet">tablet</option><option value="capsule">capsule</option>
              <option value="syrup">syrup</option><option value="injection">injection</option>
              <option value="bottle">bottle</option><option value="tube">tube</option>
            </select>
            <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('ph.price')} type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <input className="flex-1 bg-gray-700 p-2 rounded text-sm" type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} />
            <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('ph.reorder')} type="number" value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} />
          </div>
          <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('ph.supplier')} value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} />
          <button onClick={addMed} className="w-full bg-blue-600 py-2 rounded-xl text-sm font-bold">{t('ph.save')}</button>
        </div>
      )}
      <div className="space-y-2">
        {meds.map(m => {
          const low = m.quantity <= m.minStock;
          const exp = expInfo(m);
          return (
            <div key={m._id} className={`bg-gray-800 p-3 rounded-xl ${low ? 'border border-red-700' : ''}`}>
              <div className="flex justify-between items-center">
                <div className="font-semibold text-sm">{m.name}
                  {m.genericName && <span className="text-gray-500 font-normal text-xs"> ({m.genericName})</span>}
                </div>
                <div className="flex gap-1">
                  {low && <span className="text-xs px-2 py-1 rounded bg-red-700 font-bold">{t('ph.low')}</span>}
                  {exp && <span className={`text-xs px-2 py-1 rounded font-bold ${exp.c}`}>{exp.t}</span>}
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-1">{t('ph.batch')}: {m.batchNo || '-'} • Rs. {m.price}/{m.unit}</div>
              <div className="flex items-center gap-2 mt-2">
                <button onClick={() => adjust(m._id, -1)} className="bg-gray-700 w-7 h-7 rounded font-bold">−</button>
                <span className={`font-bold text-sm ${low ? 'text-red-400' : 'text-green-400'}`}>{m.quantity}</span>
                <button onClick={() => adjust(m._id, 1)} className="bg-gray-700 w-7 h-7 rounded font-bold">+</button>
                <div className="flex-1" />
                <button onClick={() => setDisId(disId === m._id ? null : m._id)} className="text-xs bg-blue-600 px-3 py-1 rounded font-bold">{t('ph.dispense')}</button>
                {mode === 'admin' && <button onClick={() => remove(m._id)} className="text-xs bg-gray-700 px-3 py-1 rounded text-red-400">✕</button>}
              </div>
              {disId === m._id && (
                <div className="mt-2 space-y-2">
                  <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('ph.patient') + ' *'} value={df.patientName} onChange={e => setDf({ ...df, patientName: e.target.value })} />
                  <div className="flex gap-2">
                    <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('ph.pemail')} value={df.patientEmail} onChange={e => setDf({ ...df, patientEmail: e.target.value })} />
                    <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={`${t('ph.qty')} (max ${m.quantity})`} type="number" value={df.quantity} onChange={e => setDf({ ...df, quantity: e.target.value })} />
                  </div>
                  <button onClick={() => dispense(m._id)} className="w-full bg-green-600 py-1 rounded text-sm font-bold">{t('ph.confirm')}</button>
                </div>
              )}
            </div>
          );
        })}
        {meds.length === 0 && <p className="text-gray-500 text-xs">{t('ph.none')}</p>}
      </div>
      {showHist && (
        <div className="space-y-1">
          <div className="text-sm font-bold">{t('ph.hist')}</div>
          {hist.map(h => (
            <div key={h._id} className="bg-gray-800 p-2 rounded-xl text-xs flex justify-between">
              <span>{h.medicineName} × {h.quantity} → {h.patientName}</span>
              <span className="text-gray-500">{new Date(h.date).toLocaleDateString()}</span>
            </div>
          ))}
          {hist.length === 0 && <p className="text-gray-500 text-xs">{t('ph.nohist')}</p>}
        </div>
      )}
    </div>
  );
}
