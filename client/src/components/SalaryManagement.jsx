import { useEffect, useState } from 'react';
import api from '../api';
import { useLang } from '../i18n/LanguageContext.jsx';

const curMonth = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
};

export default function SalaryManagement() {
  const { t } = useLang();
  const [month, setMonth] = useState(curMonth());
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(null);

  const load = async (m) => {
    try { const { data } = await api.get('/staff/salary?month=' + m); setRows(data); }
    catch (e) { console.error(e); }
  };
  useEffect(() => { load(month); }, [month]);

  const generate = async () => {
    try { const { data } = await api.post('/staff/salary/generate', { month }); alert('Generated: ' + data.count + ' salaries'); load(month); }
    catch (e) { alert('Failed: ' + (e.response?.data?.message || e.message)); }
  };
  const pay = async (id) => {
    try { await api.patch(`/staff/salary/${id}/pay`); load(month); }
    catch (e) { alert('Failed'); }
  };

  const totalNet = rows.reduce((s, x) => s + x.netPay, 0);
  const paidCount = rows.filter(x => x.status === 'paid').length;

  const Slip = ({ s }) => (
    <div className="bg-white text-gray-900 p-4 rounded-xl text-xs space-y-2 mt-2">
      <div className="text-center border-b pb-2">
        <div className="font-bold text-base">CityCare Hospital</div>
        <div className="text-gray-600">{t('hr.slip')} - {s.month}</div>
      </div>
      <div className="grid grid-cols-2 gap-1">
        <div><b>{t('common.name')}:</b> {s.staffName}</div>
        <div><b>ID:</b> {s.employeeId}</div>
        <div><b>{t('hr.designation')}:</b> {s.designation}</div>
        <div><b>{t('hr.emp_type')}:</b> {s.employmentType}</div>
      </div>
      <div className="border-t pt-1">
        <div className="font-bold">{t('hr.allowances')}</div>
        <div className="flex justify-between"><span>{t('hr.basic')}</span><span>Rs. {s.basicPay.toLocaleString()}</span></div>
        <div className="flex justify-between"><span>HRA</span><span>Rs. {s.hra.toLocaleString()}</span></div>
        <div className="flex justify-between"><span>DA</span><span>Rs. {s.da.toLocaleString()}</span></div>
        <div className="flex justify-between"><span>Medical + Transport</span><span>Rs. {(s.medical + s.transport).toLocaleString()}</span></div>
        <div className="flex justify-between font-bold"><span>{t('hr.gross')}</span><span>Rs. {s.grossPay.toLocaleString()}</span></div>
      </div>
      <div className="border-t pt-1">
        <div className="font-bold">{t('hr.deductions')}</div>
        <div className="flex justify-between"><span>PF (12%)</span><span>Rs. {s.pf.toLocaleString()}</span></div>
        {s.esi > 0 && <div className="flex justify-between"><span>ESI</span><span>Rs. {s.esi.toLocaleString()}</span></div>}
        {s.tax > 0 && <div className="flex justify-between"><span>Tax</span><span>Rs. {s.tax.toLocaleString()}</span></div>}
        <div className="flex justify-between font-bold"><span>Total</span><span>Rs. {s.totalDeductions.toLocaleString()}</span></div>
      </div>
      <div className="border-t pt-2 text-center">
        <div className="font-bold text-lg text-green-700">{t('hr.net')}: Rs. {s.netPay.toLocaleString()}</div>
        <div className={s.status === 'paid' ? 'text-green-600 font-bold' : 'text-orange-600 font-bold'}>
          {s.status === 'paid' ? '✓ ' + t('hr.paid') + (s.paidDate ? ' (' + new Date(s.paidDate).toLocaleDateString() + ')' : '') : '⏳ ' + t('hr.pending')}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-bold">💰 {t('hr.salary')}</h3>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="bg-gray-700 p-1 rounded text-sm" />
      </div>
      <div className="bg-gray-800 p-3 rounded-xl text-xs flex justify-between">
        <div><span className="text-gray-500">{t('hr.total_payout')}:</span><div className="font-bold text-lg">Rs. {totalNet.toLocaleString()}</div></div>
        <div className="text-right"><span className="text-gray-500">{t('hr.paid')}:</span><div className="font-bold text-lg">{paidCount}/{rows.length}</div></div>
      </div>
      <button onClick={generate} className="w-full bg-teal-600 py-2 rounded-xl text-sm font-bold">{t('hr.generate')} ({month})</button>
      <div className="space-y-2">
        {rows.map(s => (
          <div key={s._id} className="bg-gray-800 rounded-xl overflow-hidden">
            <button onClick={() => setOpen(open === s._id ? null : s._id)} className="w-full p-3 flex justify-between items-center text-left">
              <div>
                <div className="font-semibold text-sm">{s.staffName}</div>
                <div className="text-xs text-gray-500">{s.designation} • <span className={s.employmentType === 'government' ? 'text-orange-400' : 'text-purple-400'}>{s.employmentType === 'government' ? t('hr.govt') : t('hr.private')}</span></div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-green-400 text-sm">Rs. {s.netPay.toLocaleString()}</span>
                {s.status === 'pending'
                  ? <span onClick={(e) => { e.stopPropagation(); pay(s._id); }} className="text-xs bg-blue-600 px-3 py-1 rounded font-bold">{t('hr.pay')}</span>
                  : <span className="text-xs bg-green-700 px-2 py-1 rounded font-bold">{t('hr.paid')}</span>}
              </div>
            </button>
            {open === s._id && <div className="px-3 pb-3"><Slip s={s} /></div>}
          </div>
        ))}
        {rows.length === 0 && <p className="text-gray-500 text-xs">{t('hr.month')}: {month} - {t('hr.generate')}</p>}
      </div>
    </div>
  );
}
