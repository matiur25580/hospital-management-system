import { useEffect, useState } from 'react';
import api from '../api';
import { useLang } from '../i18n/LanguageContext.jsx';

export default function BedManagement({ mode, userName }) {
  const { t } = useLang();
  const [beds, setBeds] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [wards, setWards] = useState([]);
  const [form, setForm] = useState({ ward: '', bedNo: '', type: 'general' });
  const [assignId, setAssignId] = useState(null);
  const [pEmail, setPEmail] = useState('');

  const load = async () => {
    try { const { data } = await api.get('/beds'); setBeds(data);
    try { const { data: w } = await api.get('/beds/wards'); setWards(w); setForm(f => ({ ...f, ward: f.ward || (w[0]?._id || '') })); } catch (e) { console.error(e); } }
    catch (e) { console.error(e); }
  };
  useEffect(() => { load(); }, []);

  const addBed = async () => {
    if (!form.bedNo.trim()) { alert(t('bed.bed_no')); return; }
    try { await api.post('/beds', { ward: form.ward, bedNumber: form.bedNo.trim(), type: form.type }); setForm(f => ({ ward: f.ward, bedNo: '', type: 'general' })); setShowAdd(false); load(); }
    catch (e) { alert('Failed: ' + (e.response?.data?.message || e.message)); }
  };

  const assign = async (id) => {
    if (!pEmail.trim()) { alert(t('bed.patient_email')); return; }
    try { await api.post(`/beds/${id}/assign`, { patientEmail: pEmail }); setAssignId(null); setPEmail(''); load(); }
    catch (e) { alert('Failed: ' + (e.response?.data?.message || e.message)); }
  };

  const release = async (id) => {
    try { await api.post(`/beds/${id}/release`); load(); } catch (e) { alert('Failed'); }
  };

  const setStatus = async (id, status) => {
    try { await api.patch(`/beds/${id}`, { status }); load(); } catch (e) { alert('Failed'); }
  };

  const stColor = { available: 'bg-green-700', occupied: 'bg-red-700', maintenance: 'bg-yellow-700' };
  const stKey = { available: 'bed.available', occupied: 'bed.occupied', maintenance: 'bed.maintenance' };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-bold">{t('bed.title')}</h3>
        {mode === 'admin' && <button onClick={() => setShowAdd(!showAdd)} className="text-xs bg-teal-600 px-3 py-1 rounded font-bold">{t('bed.add_bed')}</button>}
      </div>
      {showAdd && (
        <div className="bg-gray-800 p-3 rounded-xl space-y-2">
          <div className="flex gap-2">
            <select className="flex-1 bg-gray-700 p-2 rounded text-sm" value={form.ward} onChange={e => setForm({ ...form, ward: e.target.value })}>
              {wards.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
            </select>
            <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('bed.bed_no')} value={form.bedNo} onChange={e => setForm({ ...form, bedNo: e.target.value })} />
          </div>
          <select className="w-full bg-gray-700 p-2 rounded text-sm" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            <option value="general">General</option><option value="icu">ICU</option><option value="ventilator">Ventilator</option>
          </select>
          <button onClick={addBed} className="w-full bg-blue-600 py-2 rounded-xl text-sm font-bold">{t('bed.save_bed')}</button>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        {beds.map(b => (
          <div key={b._id} className="bg-gray-800 p-3 rounded-xl">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-sm">{b.ward?.name || b.ward}-{b.bedNo}</span>
              <span className={`text-xs px-2 py-1 rounded font-bold ${stColor[b.status]}`}>{t(stKey[b.status])}</span>
            </div>
            {b.status === 'available' && (
              <button onClick={() => setAssignId(assignId === b._id ? null : b._id)} className="mt-2 text-xs bg-blue-600 px-3 py-1 rounded font-bold">{t('bed.assign')}</button>
            )}
            {assignId === b._id && (
              <div className="flex gap-1 mt-2">
                <input className="flex-1 bg-gray-700 p-1 rounded text-xs" placeholder={t('bed.patient_email')} value={pEmail} onChange={e => setPEmail(e.target.value)} />
                <button onClick={() => assign(b._id)} className="bg-green-600 px-2 rounded text-xs font-bold">OK</button>
              </div>
            )}
            {b.status === 'occupied' && (
              <button onClick={() => release(b._id)} className="mt-2 text-xs bg-gray-600 px-3 py-1 rounded font-bold">{t('bed.release')}</button>
            )}
            {mode === 'admin' && b.status === 'available' && (
              <button onClick={() => setStatus(b._id, 'maintenance')} className="mt-2 ml-1 text-xs bg-yellow-700 px-3 py-1 rounded font-bold">{t('bed.set_maintenance')}</button>
            )}
            {mode === 'admin' && b.status === 'maintenance' && (
              <button onClick={() => setStatus(b._id, 'available')} className="mt-2 text-xs bg-green-700 px-3 py-1 rounded font-bold">{t('bed.set_available')}</button>
            )}
          </div>
        ))}
      </div>
      {beds.length === 0 && <p className="text-gray-500 text-xs">{t('bed.no_beds')}</p>}
    </div>
  );
}
