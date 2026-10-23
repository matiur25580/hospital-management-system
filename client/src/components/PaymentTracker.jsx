import { useEffect, useState } from 'react';
import api from '../api';
import { useLang } from '../i18n/LanguageContext.jsx';

export default function PaymentTracker({ mode, userName }) {
  const { t } = useLang();
  const [bills, setBills] = useState([]);
  const [payId, setPayId] = useState(null);
  const [amount, setAmount] = useState('');

  const load = async () => {
    try { const { data } = await api.get('/payments'); setBills(data); }
    catch (e) { console.error(e); }
  };
  useEffect(() => { load(); }, []);

  const record = async (id) => {
    const amt = Number(amount) || 0;
    if (amt <= 0) { alert(t('pay.amount')); return; }
    try {
      await api.post(`/payments/${id}/pay`, { amount: amt, receivedBy: userName });
      setPayId(null); setAmount(''); load();
    } catch (e) { alert('Failed: ' + (e.response?.data?.message || e.message)); }
  };

  const stColor = { paid: 'bg-green-700', partial: 'bg-yellow-700', unpaid: 'bg-red-700' };

  return (
    <div className="space-y-3">
      <h3 className="font-bold">{t('pay.title')}</h3>
      {bills.map(b => (
        <div key={b._id} className="bg-gray-800 p-3 rounded-xl">
          <div className="flex justify-between items-center">
            <div className="font-semibold text-sm">{b.patientName}</div>
            <span className={`text-xs px-2 py-1 rounded font-bold ${stColor[b.status]}`}>{b.status.toUpperCase()}</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {t('pay.total_bill')}: Rs. {b.totalAmount} • {t('pay.paid')}: Rs. {b.paidAmount} • <span className="text-red-400 font-bold">{t('pay.due')}: Rs. {b.totalAmount - b.paidAmount}</span>
          </div>
          {(b.billItems || []).length > 0 && (
            <div className="text-xs text-gray-500 mt-1">{b.billItems.map(i => i.name + ' Rs.' + i.amount).join(', ')}</div>
          )}
          {b.status !== 'paid' && (
            <div className="mt-2">
              {payId === b._id ? (
                <div className="flex gap-2">
                  <input type="number" className="flex-1 bg-gray-700 p-1 rounded text-sm" placeholder={t('pay.amount')} value={amount} onChange={e => setAmount(e.target.value)} />
                  <button onClick={() => record(b._id)} className="bg-green-600 px-3 rounded text-sm font-bold">OK</button>
                  <button onClick={() => setPayId(null)} className="bg-gray-600 px-3 rounded text-sm">{t('common.cancel')}</button>
                </div>
              ) : (
                <button onClick={() => setPayId(b._id)} className="text-xs bg-blue-600 px-3 py-1 rounded font-bold">{t('pay.record')}</button>
              )}
            </div>
          )}
        </div>
      ))}
      {bills.length === 0 && <p className="text-gray-500 text-xs">{t('pay.no_bills')}</p>}
    </div>
  );
}
