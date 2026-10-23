import { useEffect, useState } from 'react';
import api from '../api';
import { useLang } from '../i18n/LanguageContext.jsx';

const emptyAmb = { vehicleNo: '', type: 'basic', driverName: '', driverPhone: '', currentLocation: '' };
const emptyReq = { patientName: '', patientPhone: '', pickupLocation: '', destination: '', emergencyType: 'General' };

export default function AmbulanceMgmt({ mode, userName }) {
  const { t } = useLang();
  const [fleet, setFleet] = useState([]);
  const [reqs, setReqs] = useState([]);
  const [tab, setTab] = useState('dispatch');
  const [showAdd, setShowAdd] = useState(false);
  const [af, setAf] = useState(emptyAmb);
  const [showReq, setShowReq] = useState(false);
  const [rf, setRf] = useState(emptyReq);
  const [assign, setAssign] = useState({});

  const load = async () => {
    try {
      const [f, d] = await Promise.all([api.get('/ambulance'), api.get('/ambulance/dispatch')]);
      setFleet(f.data); setReqs(d.data);
    } catch (e) { console.error(e); }
  };
  useEffect(() => { load(); }, []);

  const addAmb = async () => {
    if (!af.vehicleNo.trim()) { alert(t('amb.vno')); return; }
    try { await api.post('/ambulance', af); setAf(emptyAmb); setShowAdd(false); load(); }
    catch (e) { alert('Failed: ' + (e.response?.data?.message || e.message)); }
  };

  const setAmbStatus = async (id, status) => {
    try { await api.patch(`/ambulance/${id}`, { status }); load(); } catch (e) { alert('Failed'); }
  };

  const delAmb = async (id) => {
    if (!confirm(t('amb.del_confirm'))) return;
    try { await api.delete(`/ambulance/${id}`); load(); } catch (e) { alert('Failed'); }
  };

  const newReq = async () => {
    if (!rf.patientName.trim() || !rf.pickupLocation.trim()) { alert(t('amb.pname')); return; }
    try { await api.post('/ambulance/dispatch', { ...rf, requestedBy: userName }); setRf(emptyReq); setShowReq(false); load(); }
    catch (e) { alert('Failed: ' + (e.response?.data?.message || e.message)); }
  };

  const updReq = async (id, status, ambulanceId) => {
    try { await api.patch(`/ambulance/dispatch/${id}`, { status, ambulanceId }); load(); }
    catch (e) { alert('Failed: ' + (e.response?.data?.message || e.message)); }
  };

  const stColor = {
    available: 'bg-green-700', 'on-duty': 'bg-blue-700', maintenance: 'bg-gray-600',
    requested: 'bg-yellow-700', dispatched: 'bg-blue-700', arrived: 'bg-purple-700',
    completed: 'bg-green-700', cancelled: 'bg-gray-600'
  };
  const available = fleet.filter(a => a.status === 'available');

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button onClick={() => setTab('dispatch')} className={`flex-1 py-1 rounded text-sm font-bold ${tab === 'dispatch' ? 'bg-red-600' : 'bg-gray-700'}`}>🚨 {t('amb.dispatch_tab')}</button>
        <button onClick={() => setTab('fleet')} className={`flex-1 py-1 rounded text-sm font-bold ${tab === 'fleet' ? 'bg-red-600' : 'bg-gray-700'}`}>{t('amb.fleet_tab')} ({fleet.length})</button>
      </div>
      {tab === 'dispatch' && (
        <div className="space-y-2">
          <button onClick={() => setShowReq(!showReq)} className="w-full bg-red-600 py-2 rounded-xl text-sm font-bold">{t('amb.new_req')}</button>
          {showReq && (
            <div className="bg-gray-800 p-3 rounded-xl space-y-2">
              <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('amb.pname') + ' *'} value={rf.patientName} onChange={e => setRf({ ...rf, patientName: e.target.value })} />
              <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('amb.pphone')} value={rf.patientPhone} onChange={e => setRf({ ...rf, patientPhone: e.target.value })} />
              <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('amb.pickup') + ' *'} value={rf.pickupLocation} onChange={e => setRf({ ...rf, pickupLocation: e.target.value })} />
              <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('amb.dest')} value={rf.destination} onChange={e => setRf({ ...rf, destination: e.target.value })} />
              <select className="w-full bg-gray-700 p-2 rounded text-sm" value={rf.emergencyType} onChange={e => setRf({ ...rf, emergencyType: e.target.value })}>
                <option>General</option><option>Accident</option><option>Cardiac</option><option>Maternity</option><option>Critical (ICU)</option>
              </select>
              <button onClick={newReq} className="w-full bg-blue-600 py-2 rounded-xl text-sm font-bold">{t('amb.send')}</button>
            </div>
          )}
          {reqs.map(d => (
            <div key={d._id} className="bg-gray-800 p-3 rounded-xl">
              <div className="flex justify-between items-center">
                <div className="font-semibold text-sm">{d.patientName}<span className="text-gray-500 font-normal text-xs"> • {d.emergencyType}</span></div>
                <span className={`text-xs px-2 py-1 rounded font-bold ${stColor[d.status]}`}>{d.status.toUpperCase()}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">📍 {d.pickupLocation} → {d.destination || 'Hospital'}</div>
              {d.vehicleNo && <div className="text-xs text-gray-400">🚑 {d.vehicleNo} • {d.driverName}</div>}
              {d.status === 'requested' && (
                <div className="flex gap-2 mt-2">
                  <select className="flex-1 bg-gray-700 p-1 rounded text-sm" value={assign[d._id] || ''} onChange={e => setAssign({ ...assign, [d._id]: e.target.value })}>
                    <option value="">{t('amb.select')} ({available.length} {t('amb.free')})</option>
                    {available.map(a => <option key={a._id} value={a._id}>{a.vehicleNo} ({a.type})</option>)}
                  </select>
                  <button onClick={() => assign[d._id] ? updReq(d._id, 'dispatched', assign[d._id]) : alert(t('amb.select'))} className="bg-blue-600 px-3 rounded text-sm font-bold">{t('common.apply') === 'Apply' ? 'Dispatch' : t('amb.dispatch_tab')}</button>
                  <button onClick={() => updReq(d._id, 'cancelled')} className="bg-gray-600 px-3 rounded text-sm">✕</button>
                </div>
              )}
              {d.status === 'dispatched' && <button onClick={() => updReq(d._id, 'arrived')} className="mt-2 text-xs bg-purple-600 px-3 py-1 rounded font-bold">{t('amb.arrived')}</button>}
              {d.status === 'arrived' && <button onClick={() => updReq(d._id, 'completed')} className="mt-2 text-xs bg-green-600 px-3 py-1 rounded font-bold">{t('amb.completed')}</button>}
            </div>
          ))}
          {reqs.length === 0 && <p className="text-gray-500 text-xs">{t('amb.no_req')}</p>}
        </div>
      )}
      {tab === 'fleet' && (
        <div className="space-y-2">
          {mode === 'admin' && <button onClick={() => setShowAdd(!showAdd)} className="w-full bg-teal-600 py-2 rounded-xl text-sm font-bold">{t('amb.add')}</button>}
          {showAdd && (
            <div className="bg-gray-800 p-3 rounded-xl space-y-2">
              <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('amb.vno') + ' *'} value={af.vehicleNo} onChange={e => setAf({ ...af, vehicleNo: e.target.value })} />
              <div className="flex gap-2">
                <select className="flex-1 bg-gray-700 p-2 rounded text-sm" value={af.type} onChange={e => setAf({ ...af, type: e.target.value })}>
                  <option value="basic">Basic</option><option value="advanced">Advanced</option><option value="icu">ICU</option>
                </select>
                <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('amb.pickup')} value={af.currentLocation} onChange={e => setAf({ ...af, currentLocation: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('common.name')} value={af.driverName} onChange={e => setAf({ ...af, driverName: e.target.value })} />
                <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('common.phone')} value={af.driverPhone} onChange={e => setAf({ ...af, driverPhone: e.target.value })} />
              </div>
              <button onClick={addAmb} className="w-full bg-blue-600 py-2 rounded-xl text-sm font-bold">{t('amb.save')}</button>
            </div>
          )}
          {fleet.map(a => (
            <div key={a._id} className="bg-gray-800 p-3 rounded-xl">
              <div className="flex justify-between items-center">
                <div className="font-semibold text-sm">🚑 {a.vehicleNo}<span className="text-gray-500 font-normal text-xs"> ({a.type.toUpperCase()})</span></div>
                <span className={`text-xs px-2 py-1 rounded font-bold ${stColor[a.status]}`}>{a.status.toUpperCase()}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">{t('amb.pname').split(' ')[0]}: {a.driverName || '-'} • {a.driverPhone || '-'}</div>
              {mode === 'admin' && (
                <div className="flex gap-2 mt-2">
                  {a.status !== 'available' && <button onClick={() => setAmbStatus(a._id, 'available')} className="text-xs bg-green-700 px-2 py-1 rounded">{t('bed.set_available')}</button>}
                  {a.status !== 'maintenance' && <button onClick={() => setAmbStatus(a._id, 'maintenance')} className="text-xs bg-gray-600 px-2 py-1 rounded">{t('bed.set_maintenance')}</button>}
                  <button onClick={() => delAmb(a._id)} className="text-xs bg-gray-700 px-2 py-1 rounded text-red-400">✕</button>
                </div>
              )}
            </div>
          ))}
          {fleet.length === 0 && <p className="text-gray-500 text-xs">{t('amb.no_amb')}</p>}
        </div>
      )}
    </div>
  );
}
