import { useState } from 'react';
import api from '../api';

const FILE_ROOT = (api.defaults.baseURL || 'http://localhost:5000/api').replace(/\/api$/, '');

const STATUS_STYLE = { 'new': 'bg-blue-700', 'under-treatment': 'bg-yellow-700', 'discharged': 'bg-green-700' };
const STATUS_LABEL = { 'new': 'New', 'under-treatment': 'Under Treatment', 'discharged': 'Discharged' };

export default function CaseCard({ c, canNote, authorName, role, onNoteSaved, canStatus, onStatusChanged }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [showBill, setShowBill] = useState(false);
  const [items, setItems] = useState([{ description: '', amount: '' }]);
  const [fee, setFee] = useState('');

  const st = c.status || 'new';

  const saveNote = async () => {
    if (!note.trim()) { alert('Write a note first'); return; }
    setSaving(true);
    try {
      await api.patch(`/cases/${c._id}/notes`, { author: authorName, role, text: note.trim() });
      setNote('');
      if (onNoteSaved) onNoteSaved();
      alert('Note saved — case PDF regenerated');
    } catch (e) { alert('Failed: ' + (e.response?.data?.message || e.message)); }
    setSaving(false);
  };

  const setStatus = (s) => {
    if (s === 'discharged') { setShowBill(true); return; }
    if (onStatusChanged) onStatusChanged(c._id, { status: s });
  };

  const updItem = (i, k, v) => setItems(items.map((it, j) => (j === i ? { ...it, [k]: v } : it)));
  const addItem = () => setItems([...items, { description: '', amount: '' }]);
  const delItem = (i) => setItems(items.filter((_, j) => j !== i));

  const confirmDischarge = () => {
    const billItems = items
      .filter(it => it.description.trim() !== '')
      .map(it => ({ description: it.description.trim(), amount: Number(it.amount) || 0 }));
    if (onStatusChanged) onStatusChanged(c._id, { status: 'discharged', billItems, doctorFee: Number(fee) || 0 });
    setShowBill(false);
    setItems([{ description: '', amount: '' }]);
    setFee('');
  };

  const Detail = ({ k, v }) => v ? (
    <div className="text-sm"><span className="text-gray-500">{k}: </span><span className="text-gray-200">{v}</span></div>
  ) : null;

  return (
    <div className="bg-gray-800 p-3 rounded-xl">
      <div className="flex justify-between items-center cursor-pointer" onClick={() => setOpen(!open)}>
        <div>
          <div className="font-semibold">{c.patientName} {c.age && <span className="text-gray-400 text-sm">({c.age} yrs)</span>}</div>
          <div className="text-gray-400 text-sm">{c.disease}</div>
          <div className="text-gray-500 text-xs">Submitted: {c.submittedAt ? new Date(c.submittedAt).toLocaleString() : ''}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-xs px-2 py-1 rounded font-bold ${STATUS_STYLE[st] || 'bg-gray-700'}`}>{STATUS_LABEL[st] || st}</span>
          <span className="text-blue-400 text-xs">{open ? '▲ Hide' : '▼ Details'}</span>
        </div>
      </div>
      <div className="mt-2 flex gap-3 items-center flex-wrap">
        {c.pdfUrl && <a href={FILE_ROOT + c.pdfUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 underline">Case PDF</a>}
        {c.billPdfUrl && <a href={FILE_ROOT + c.billPdfUrl} target="_blank" rel="noreferrer" className="text-xs text-green-400 underline">Bill PDF</a>}
        {c.dischargePdfUrl && <a href={FILE_ROOT + c.dischargePdfUrl} target="_blank" rel="noreferrer" className="text-xs text-purple-400 underline">Discharge Summary</a>}
        <span className="text-xs text-gray-500">{(c.notes || []).length} note(s)</span>
      </div>
      {canStatus && (
        <div className="mt-2 flex gap-2 flex-wrap">
          <button onClick={() => setStatus('new')} className={`text-xs px-3 py-1 rounded-full ${st === 'new' ? 'bg-blue-600' : 'bg-gray-700'}`}>New</button>
          <button onClick={() => setStatus('under-treatment')} className={`text-xs px-3 py-1 rounded-full ${st === 'under-treatment' ? 'bg-yellow-600' : 'bg-gray-700'}`}>Under Treatment</button>
          <button onClick={() => setStatus('discharged')} className={`text-xs px-3 py-1 rounded-full ${st === 'discharged' ? 'bg-green-600' : 'bg-gray-700'}`}>Discharge + Bill</button>
        </div>
      )}
      {showBill && (
        <div className="mt-2 bg-gray-700 p-3 rounded-xl space-y-2">
          <div className="font-bold text-sm">Discharge Bill</div>
          {items.map((it, i) => (
            <div key={i} className="flex gap-2">
              <input className="flex-1 bg-gray-600 p-2 rounded text-sm" placeholder="Item (medicine/test/room)"
                value={it.description} onChange={e => updItem(i, 'description', e.target.value)} />
              <input className="w-24 bg-gray-600 p-2 rounded text-sm" placeholder="Rs."
                value={it.amount} onChange={e => updItem(i, 'amount', e.target.value)} />
              {items.length > 1 && <button onClick={() => delItem(i)} className="text-red-400 text-sm">✕</button>}
            </div>
          ))}
          <button onClick={addItem} className="text-xs text-blue-400">+ Add item</button>
          <input className="w-full bg-gray-600 p-2 rounded text-sm" placeholder="Doctor fee (Rs.)"
            value={fee} onChange={e => setFee(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={confirmDischarge} className="flex-1 bg-green-600 py-2 rounded-xl text-sm font-bold">Confirm Discharge & Generate Bill</button>
            <button onClick={() => setShowBill(false)} className="px-4 bg-gray-600 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}
      {open && (
        <div className="mt-2 pt-2 border-t border-gray-700 space-y-1">
          <Detail k="Gender" v={c.gender} />
          <Detail k="Phone" v={c.phone} />
          <Detail k="Address" v={c.address} />
          <Detail k="Symptoms" v={c.symptoms} />
          <Detail k="Duration" v={c.duration} />
          <Detail k="Medical history" v={c.medicalHistory} />
          <Detail k="Allergies" v={c.allergies} />
          {c.dischargedAt && <Detail k="Discharged" v={new Date(c.dischargedAt).toLocaleString()} />}
          {(c.notes || []).length > 0 && (
            <div className="mt-2">
              <div className="text-sm font-bold text-gray-300">Clinical notes / descriptions:</div>
              {(c.notes || []).map((n, i) => (
                <div key={i} className="bg-gray-700 p-2 rounded mt-1">
                  <div className="text-xs text-gray-400">{n.role} • {n.author} • {n.date ? new Date(n.date).toLocaleString() : ''}</div>
                  <div className="text-sm text-gray-200">{n.text}</div>
                </div>
              ))}
            </div>
          )}
          {canNote && (
            <div className="mt-2 space-y-2">
              <textarea className="w-full bg-gray-700 p-2 rounded text-sm" rows="2"
                placeholder={'Add ' + role + ' note / description...'}
                value={note} onChange={e => setNote(e.target.value)} />
              <button onClick={saveNote} disabled={saving}
                className="bg-blue-600 px-4 py-1 rounded-full text-sm font-bold disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Note (PDF auto-updates)'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
