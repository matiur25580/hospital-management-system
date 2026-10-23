import { useEffect, useState } from 'react';
import api from '../api';
import { useLang } from '../i18n/LanguageContext.jsx';

const SCHEMES = ['swasthya-sathi', 'ayushman', 'private', 'esi'];
const SCHEME_LABEL = { 'swasthya-sathi': 'Swasthya Sathi', 'ayushman': 'Ayushman Bharat', 'private': 'Private Insurance', 'esi': 'ESI' };
const FLOW = ['draft', 'submitted', 'under-review', 'query-raised', 'approved', 'settled'];
const DOCS = ['Swasthya Sathi Card', 'Aadhaar Card', 'Discharge Summary', 'Final Bill', 'Lab Reports', 'Prescription'];

export default function InsuranceClaims({ mode }) {
  const { t } = useLang();
  const [tab, setTab] = useState('summary');
  const [summary, setSummary] = useState(null);
  const [list, setList] = useState([]);
  const [fStatus, setFStatus] = useState('');
  const [fScheme, setFScheme] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [me, setMe] = useState({ email: '', name: '' });
  const [open, setOpen] = useState(null);
  const [remarks, setRemarks] = useState({});
  const [f, setF] = useState({ patientName: '', patientEmail: '', scheme: 'swasthya-sathi', cardNo: '', billNo: '', billAmount: '', claimAmount: '', admissionDate: '', dischargeDate: '', diagnosis: '', documents: [] });

  const load = async () => {
    try {
      const m = await api.get('/auth/me');
      const email = m.data.email || '';
      setMe({ email, name: m.data.name || '' });
      let url = '/insurance';
      if (mode === 'patient') url += '?patientEmail=' + encodeURIComponent(email);
      else {
        const parts = [];
        if (fStatus) parts.push('status=' + fStatus);
        if (fScheme) parts.push('scheme=' + fScheme);
        if (parts.length) url += '?' + parts.join('&');
      }
      const [cl, sm] = await Promise.all([
        api.get(url),
        mode === 'admin' ? api.get('/insurance/summary') : Promise.resolve({ data: null })
      ]);
      setList(cl.data); setSummary(sm.data);
    } catch (e) { console.error(e); }
  };
  useEffect(() => { load(); }, [fStatus, fScheme]);

  const toggleDoc = (d) => setF({ ...f, documents: f.documents.includes(d) ? f.documents.filter(x => x !== d) : [...f.documents, d] });

  const create = async () => {
    if (!f.patientName.trim() || !Number(f.claimAmount)) { alert(t('common.name') + ' / ' + t('in.claim_amt')); return; }
    try {
      await api.post('/insurance', {
        ...f, billAmount: Number(f.billAmount) || 0, claimAmount: Number(f.claimAmount) || 0,
        handledBy: me.name
      });
      setF({ patientName: '', patientEmail: '', scheme: 'swasthya-sathi', cardNo: '', billNo: '', billAmount: '', claimAmount: '', admissionDate: '', dischargeDate: '', diagnosis: '', documents: [] });
      setShowForm(false); load();
    } catch (e) { alert('Failed'); }
  };

  const advance = async (id, status) => {
    try {
      await api.patch(`/insurance/${id}/status`, { status, remarks: remarks[id] || '', by: me.name });
      setRemarks({ ...remarks, [id]: '' }); load();
    } catch (e) { alert('Failed'); }
  };

  const stColor = { draft: 'bg-gray-600', submitted: 'bg-blue-700', 'under-review': 'bg-purple-700', 'query-raised': 'bg-yellow-700', approved: 'bg-green-700', rejected: 'bg-red-700', settled: 'bg-teal-700' };
  const fmtStatus = (s) => s.replace('-', ' ').toUpperCase();

  return (
    <div className="space-y-3">
      <h3 className="font-bold">🏥 {t('in.title')}</h3>

      {mode === 'admin' && (
        <div className="flex gap-2">
          <button onClick={() => setTab('summary')} className={`flex-1 py-1 rounded text-sm font-bold ${tab === 'summary' ? 'bg-blue-600' : 'bg-gray-700'}`}>{t('in.summary')}</button>
          <button onClick={() => setTab('claims')} className={`flex-1 py-1 rounded text-sm font-bold ${tab === 'claims' ? 'bg-blue-600' : 'bg-gray-700'}`}>{t('in.claims')} ({list.length})</button>
        </div>
      )}

      {mode === 'admin' && tab === 'summary' && summary && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-gray-800 p-3 rounded-xl"><div className="text-gray-500">{t('in.claimed')}</div><div className="font-bold text-lg">Rs. {summary.totalClaimed.toLocaleString()}</div></div>
            <div className="bg-gray-800 p-3 rounded-xl"><div className="text-gray-500">{t('in.approved')}</div><div className="font-bold text-lg text-green-400">Rs. {summary.totalApproved.toLocaleString()}</div></div>
            <div className="bg-gray-800 p-3 rounded-xl"><div className="text-gray-500">{t('in.settled')}</div><div className="font-bold text-lg text-teal-400">Rs. {summary.totalSettled.toLocaleString()}</div></div>
            <div className="bg-gray-800 p-3 rounded-xl"><div className="text-gray-500">{t('in.pending')}</div><div className="font-bold text-lg text-yellow-400">{(summary.byStatus['submitted'] || 0) + (summary.byStatus['under-review'] || 0) + (summary.byStatus['query-raised'] || 0)}</div></div>
          </div>
          <div className="text-xs font-bold text-gray-400">{t('in.scheme')}</div>
          {summary.byScheme.map(s => (
            <div key={s.scheme} className="bg-gray-800 p-2 rounded-xl text-xs flex justify-between">
              <span className="font-semibold">{SCHEME_LABEL[s.scheme]} <span className="text-gray-500">({s.count})</span></span>
              <span className="font-bold">Rs. {s.claimed.toLocaleString()}</span>
            </div>
          ))}
          <div className="text-xs font-bold text-gray-400">{t('in.history')}</div>
          <div className="flex flex-wrap gap-1">
            {Object.entries(summary.byStatus).map(([st, n]) => (
              <span key={st} className={`text-[10px] px-2 py-1 rounded font-bold ${stColor[st]}`}>{fmtStatus(st)}: {n}</span>
            ))}
          </div>
        </div>
      )}

      {(mode === 'patient' || (mode === 'admin' && tab === 'claims')) && (
        <div className="space-y-2">
          {mode === 'admin' && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <select className="flex-1 bg-gray-700 p-2 rounded text-sm" value={fStatus} onChange={e => setFStatus(e.target.value)}>
                  <option value="">All status</option>
                  {[...FLOW, 'rejected'].map(s => <option key={s} value={s}>{fmtStatus(s)}</option>)}
                </select>
                <select className="flex-1 bg-gray-700 p-2 rounded text-sm" value={fScheme} onChange={e => setFScheme(e.target.value)}>
                  <option value="">All schemes</option>
                  {SCHEMES.map(s => <option key={s} value={s}>{SCHEME_LABEL[s]}</option>)}
                </select>
                <button onClick={() => setShowForm(!showForm)} className="bg-teal-600 px-4 rounded-xl text-sm font-bold">{t('in.new')}</button>
              </div>
              {showForm && (
                <div className="bg-gray-800 p-3 rounded-xl space-y-2">
                  <div className="flex gap-2">
                    <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('common.name') + ' *'} value={f.patientName} onChange={e => setF({ ...f, patientName: e.target.value })} />
                    <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('common.email')} value={f.patientEmail} onChange={e => setF({ ...f, patientEmail: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <select className="flex-1 bg-gray-700 p-2 rounded text-sm" value={f.scheme} onChange={e => setF({ ...f, scheme: e.target.value })}>
                      {SCHEMES.map(s => <option key={s} value={s}>{SCHEME_LABEL[s]}</option>)}
                    </select>
                    <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('in.card')} value={f.cardNo} onChange={e => setF({ ...f, cardNo: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('in.bill')} value={f.billNo} onChange={e => setF({ ...f, billNo: e.target.value })} />
                    <input type="number" className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('in.bill_amt')} value={f.billAmount} onChange={e => setF({ ...f, billAmount: e.target.value })} />
                    <input type="number" className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('in.claim_amt') + ' *'} value={f.claimAmount} onChange={e => setF({ ...f, claimAmount: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <input type="date" className="flex-1 bg-gray-700 p-2 rounded text-sm" value={f.admissionDate} onChange={e => setF({ ...f, admissionDate: e.target.value })} />
                    <input type="date" className="flex-1 bg-gray-700 p-2 rounded text-sm" value={f.dischargeDate} onChange={e => setF({ ...f, dischargeDate: e.target.value })} />
                  </div>
                  <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('in.diagnosis')} value={f.diagnosis} onChange={e => setF({ ...f, diagnosis: e.target.value })} />
                  <div className="text-xs text-gray-400">{t('in.docs')}:</div>
                  <div className="flex flex-wrap gap-1">
                    {DOCS.map(d => (
                      <button key={d} onClick={() => toggleDoc(d)}
                        className={`text-[11px] px-2 py-1 rounded ${f.documents.includes(d) ? 'bg-green-700 font-bold' : 'bg-gray-700'}`}>{d}</button>
                    ))}
                  </div>
                  <button onClick={create} className="w-full bg-blue-600 py-2 rounded-xl text-sm font-bold">{t('common.save')}</button>
                </div>
              )}
            </div>
          )}
          {list.map(c => (
            <div key={c._id} className="bg-gray-800 rounded-xl overflow-hidden">
              <button onClick={() => setOpen(open === c._id ? null : c._id)} className="w-full p-3 flex justify-between items-center text-left">
                <div>
                  <div className="font-semibold text-sm">{c.claimNo} <span className="text-gray-500 font-normal">({c.patientName})</span></div>
                  <div className="text-xs text-gray-500">{SCHEME_LABEL[c.scheme]} • Rs. {Number(c.claimAmount).toLocaleString()}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded font-bold ${stColor[c.status]}`}>{fmtStatus(c.status)}</span>
              </button>
              {open === c._id && (
                <div className="px-3 pb-3 text-xs space-y-1">
                  <div className="grid grid-cols-2 gap-1 text-gray-400">
                    <div>{t('in.card')}: <b className="text-gray-200">{c.cardNo || '-'}</b></div>
                    <div>{t('in.bill')}: <b className="text-gray-200">{c.billNo || '-'} (Rs. {Number(c.billAmount).toLocaleString()})</b></div>
                    <div>{t('in.admit')}: <b className="text-gray-200">{c.admissionDate || '-'}</b></div>
                    <div>{t('in.discharge')}: <b className="text-gray-200">{c.dischargeDate || '-'}</b></div>
                  </div>
                  {c.diagnosis && <div className="text-gray-400">{t('in.diagnosis')}: <b className="text-gray-200">{c.diagnosis}</b></div>}
                  {(c.documents || []).length > 0 && <div className="text-gray-400">{t('in.docs')}: <span className="text-green-300">{c.documents.join(', ')}</span></div>}
                  <div className="text-gray-400 font-bold mt-2">{t('in.history')}:</div>
                  {(c.statusHistory || []).map((h, i) => (
                    <div key={i} className="text-gray-500 ml-2">• {fmtStatus(h.status)} - {new Date(h.date).toLocaleDateString()}{h.by ? ` (${t('in.by')} ${h.by})` : ''}{h.remarks ? `: ${h.remarks}` : ''}</div>
                  ))}
                  {mode === 'admin' && !['settled', 'rejected'].includes(c.status) && (
                    <div className="mt-2 space-y-2">
                      <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('in.remarks')}
                        value={remarks[c._id] || ''} onChange={e => setRemarks({ ...remarks, [c._id]: e.target.value })} />
                      <div className="flex gap-1 flex-wrap">
                        {FLOW.filter(s => s !== c.status).map(s => (
                          <button key={s} onClick={() => advance(c._id, s)} className="bg-gray-700 px-2 py-1 rounded text-xs">→ {fmtStatus(s)}</button>
                        ))}
                        <button onClick={() => advance(c._id, 'rejected')} className="bg-red-700 px-2 py-1 rounded text-xs font-bold">✕ Rejected</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {list.length === 0 && <p className="text-gray-500 text-xs">{t('in.no_claims')}</p>}
        </div>
      )}
    </div>
  );
}
