import { useEffect, useState } from 'react';
import api from '../api';
import { useLang } from '../i18n/LanguageContext.jsx';

const GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function BloodBank({ mode, userName }) {
  const { t } = useLang();
  const [stock, setStock] = useState([]);
  const [reqs, setReqs] = useState([]);
  const [showReq, setShowReq] = useState(false);
  const [rf, setRf] = useState({ patientName: '', patientEmail: '', bloodGroup: 'A+', units: '', urgency: 'normal', reason: '' });
  const [restock, setRestock] = useState({ bloodGroup: 'A+', units: '' });
  const [me, setMe] = useState('');

  const load = async () => {
    try {
      const [s, q, m] = await Promise.all([api.get('/bloodbank/stock'), api.get('/bloodbank/requests'), api.get('/auth/me')]);
      setStock(s.data); setReqs(q.data); setMe(m.data.name || userName || '');
    } catch (e) { console.error(e); }
  };
  useEffect(() => { load(); }, []);

  const sendRequest = async () => {
    const u = Number(rf.units) || 0;
    if (!rf.patientName.trim() || u <= 0) { alert(t('bb.qty')); return; }
    try {
      await api.post('/bloodbank/requests', { ...rf, units: u, requestedBy: me });
      setRf({ patientName: '', patientEmail: '', bloodGroup: 'A+', units: '', urgency: 'normal', reason: '' });
      setShowReq(false); load();
    } catch (e) { alert('Failed'); }
  };

  const decide = async (id, status) => {
    try { await api.patch(`/bloodbank/requests/${id}`, { status }); load(); }
    catch (e) { alert('Failed: ' + (e.response?.data?.message || e.message)); }
  };

  const addStock = async () => {
    const u = Number(restock.units) || 0;
    if (u <= 0) { alert(t('bb.qty')); return; }
    try { await api.post('/bloodbank/stock', restock); setRestock({ bloodGroup: 'A+', units: '' }); load(); }
    catch (e) { alert('Failed'); }
  };

  const urgColor = { normal: 'bg-gray-600', urgent: 'bg-yellow-700', emergency: 'bg-red-700' };
  const stColor = { pending: 'bg-yellow-700', fulfilled: 'bg-green-700', rejected: 'bg-gray-600' };
  const lowGroups = stock.filter(s => s.units < 5);

  return (
    <div className="space-y-3">
      <h3 className="font-bold">🩸 {t('bb.title')}</h3>

      <div className="text-xs font-bold text-gray-400">{t('bb.stock')}</div>
      {lowGroups.length > 0 && (
        <div className="bg-red-900 border border-red-700 p-2 rounded-xl text-xs font-bold text-red-200">
          ⚠ {t('bb.low')}: {lowGroups.map(g => g.bloodGroup).join(', ')}
        </div>
      )}
      <div className="grid grid-cols-4 gap-2">
        {stock.map(s => (
          <div key={s.bloodGroup} className={`bg-gray-800 p-2 rounded-xl text-center ${s.units < 5 ? 'border border-red-700' : ''}`}>
            <div className="font-bold text-red-400">{s.bloodGroup}</div>
            <div className={`text-lg font-bold ${s.units < 5 ? 'text-red-400' : 'text-green-400'}`}>{s.units}</div>
            <div className="text-[10px] text-gray-500">{t('bb.units')}</div>
          </div>
        ))}
      </div>

      {mode === 'admin' && (
        <div className="flex gap-2">
          <select className="flex-1 bg-gray-700 p-2 rounded text-sm" value={restock.bloodGroup} onChange={e => setRestock({ ...restock, bloodGroup: e.target.value })}>
            {GROUPS.map(g => <option key={g}>{g}</option>)}
          </select>
          <input type="number" className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('bb.qty')} value={restock.units} onChange={e => setRestock({ ...restock, units: e.target.value })} />
          <button onClick={addStock} className="bg-teal-600 px-4 rounded text-sm font-bold">{t('bb.restock')}</button>
        </div>
      )}

      <button onClick={() => setShowReq(!showReq)} className="w-full bg-red-600 py-2 rounded-xl text-sm font-bold">{t('bb.request')}</button>
      {showReq && (
        <div className="bg-gray-800 p-3 rounded-xl space-y-2">
          <div className="flex gap-2">
            <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('common.name') + ' *'} value={rf.patientName} onChange={e => setRf({ ...rf, patientName: e.target.value })} />
            <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('common.email')} value={rf.patientEmail} onChange={e => setRf({ ...rf, patientEmail: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <select className="flex-1 bg-gray-700 p-2 rounded text-sm" value={rf.bloodGroup} onChange={e => setRf({ ...rf, bloodGroup: e.target.value })}>
              {GROUPS.map(g => <option key={g}>{g}</option>)}
            </select>
            <input type="number" className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('bb.qty') + ' *'} value={rf.units} onChange={e => setRf({ ...rf, units: e.target.value })} />
            <select className="flex-1 bg-gray-700 p-2 rounded text-sm" value={rf.urgency} onChange={e => setRf({ ...rf, urgency: e.target.value })}>
              <option value="normal">Normal</option><option value="urgent">Urgent</option><option value="emergency">Emergency</option>
            </select>
          </div>
          <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('common.reason')} value={rf.reason} onChange={e => setRf({ ...rf, reason: e.target.value })} />
          <button onClick={sendRequest} className="w-full bg-blue-600 py-2 rounded-xl text-sm font-bold">{t('common.save')}</button>
        </div>
      )}

      <div className="text-xs font-bold text-gray-400">{t('bb.pending')} ({reqs.filter(x => x.status === 'pending').length})</div>
      <div className="space-y-2">
        {reqs.map(q => (
          <div key={q._id} className="bg-gray-800 p-3 rounded-xl text-xs">
            <div className="flex justify-between items-center">
              <div className="font-semibold text-sm">{q.patientName} <span className="text-red-400 font-bold">{q.bloodGroup} × {q.units}</span></div>
              <div className="flex gap-1">
                <span className={`px-2 py-1 rounded font-bold ${urgColor[q.urgency]}`}>{q.urgency.toUpperCase()}</span>
                <span className={`px-2 py-1 rounded font-bold ${stColor[q.status]}`}>{q.status.toUpperCase()}</span>
              </div>
            </div>
            <div className="text-gray-500 mt-1">{q.reason} • {q.requestedBy}</div>
            {q.status === 'pending' && mode === 'admin' && (
              <div className="flex gap-2 mt-2">
                <button onClick={() => decide(q._id, 'fulfilled')} className="bg-green-600 px-3 py-1 rounded font-bold">{t('common.approve')}</button>
                <button onClick={() => decide(q._id, 'rejected')} className="bg-red-600 px-3 py-1 rounded font-bold">{t('common.reject')}</button>
              </div>
            )}
          </div>
        ))}
        {reqs.length === 0 && <p className="text-gray-500 text-xs">{t('bb.no_req')}</p>}
      </div>
    </div>
  );
}
