import { useEffect, useState } from 'react';
import api from '../api';
import { useLang } from '../i18n/LanguageContext.jsx';

const STAGES = ['dispatched', 'en-route', 'on-scene', 'to-hospital', 'completed'];
const STAGE_LABEL = (t, s) => t('amb.st_' + s.replace('-', '_'));
const fmtT = (iso) => iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

export default function AmbulanceTracking({ mode }) {
  const { t } = useLang();
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [me, setMe] = useState('');
  const [locEdits, setLocEdits] = useState({});
  const [f, setF] = useState({ ambulanceId: '', patientName: '', patientPhone: '', pickupLocation: '', destination: 'CityCare Hospital', notes: '' });

  const load = async () => {
    try {
      const [v, tr, m] = await Promise.all([
        api.get('/ambulance/vehicles'), api.get('/ambulance/trips?active=1'), api.get('/auth/me')
      ]);
      setVehicles(v.data); setTrips(tr.data); setMe(m.data.name || '');
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    load();
    if (mode === 'view') { const iv = setInterval(load, 15000); return () => clearInterval(iv); }
  }, []);

  const seed = async () => {
    try { const { data } = await api.post('/ambulance/seed'); alert('Added: ' + data.seeded); load(); }
    catch (e) { alert('Failed'); }
  };

  const dispatch = async () => {
    if (!f.ambulanceId || !f.patientName.trim() || !f.pickupLocation.trim()) { alert(t('amb.pickup')); return; }
    try {
      await api.post('/ambulance/trips', { ...f, dispatchedBy: me });
      setF({ ambulanceId: '', patientName: '', patientPhone: '', pickupLocation: '', destination: 'CityCare Hospital', notes: '' });
      setShowForm(false); load();
    } catch (e) { alert('Failed: ' + (e.response?.data?.message || e.message)); }
  };

  const advance = async (trip) => {
    const idx = STAGES.indexOf(trip.status);
    if (idx < 0 || idx >= STAGES.length - 1) return;
    try { await api.patch(`/ambulance/trips/${trip._id}`, { status: STAGES[idx + 1] }); load(); }
    catch (e) { alert('Failed'); }
  };

  const setLocation = async (trip) => {
    const loc = (locEdits[trip._id] || '').trim();
    if (!loc) return;
    try { await api.patch(`/ambulance/trips/${trip._id}`, { currentLocation: loc }); setLocEdits({ ...locEdits, [trip._id]: '' }); load(); }
    catch (e) { alert('Failed'); }
  };

  const cancel = async (id) => {
    if (!confirm(t('amb.cancel') + '?')) return;
    try { await api.patch(`/ambulance/trips/${id}`, { status: 'cancelled' }); load(); }
    catch (e) { alert('Failed'); }
  };

  const vColor = { available: 'bg-green-700', 'on-trip': 'bg-orange-700', maintenance: 'bg-red-700' };

  const Timeline = ({ trip }) => {
    const idx = STAGES.indexOf(trip.status);
    return (
      <div className="flex items-center mt-2 text-[10px]">
        {STAGES.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className="flex flex-col items-center" style={{ minWidth: 44 }}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${i <= idx ? 'bg-green-600' : 'bg-gray-600'}`}>
                {i < idx ? '✓' : i + 1}
              </div>
              <div className={`mt-1 text-center ${i <= idx ? 'text-green-300' : 'text-gray-500'}`}>{STAGE_LABEL(t, s)}</div>
              <div className="text-gray-600">{fmtT((trip.stages || {})[{ 'dispatched': 'dispatched', 'en-route': 'enRoute', 'on-scene': 'onScene', 'to-hospital': 'toHospital', 'completed': 'completed' }[s]])}</div>
            </div>
            {i < STAGES.length - 1 && <div className={`flex-1 h-0.5 mx-1 ${i < idx ? 'bg-green-600' : 'bg-gray-600'}`} />}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-bold">🚑 {t('amb.title')}</h3>
        {mode === 'view' && <span className="text-[10px] text-green-400">🟢 {t('amb.auto')}</span>}
      </div>

      {mode === 'control' && (
        <div className="space-y-2">
          <div className="text-xs font-bold text-gray-400">{t('amb.vehicles')} ({vehicles.length})</div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {vehicles.map(v => (
              <div key={v._id} className="bg-gray-800 p-2 rounded-xl text-xs whitespace-nowrap">
                <div className="font-bold">{v.vehicleNo}</div>
                <div className="text-gray-500">{v.driverName} • {v.type}</div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${vColor[v.status]}`}>{t('amb.' + v.status.replace('-', '_'))}</span>
              </div>
            ))}
            {vehicles.length === 0 && <button onClick={seed} className="bg-purple-600 px-4 py-2 rounded-xl text-sm font-bold">{t('amb.seed')}</button>}
          </div>
          <button onClick={() => setShowForm(!showForm)} className="w-full bg-teal-600 py-2 rounded-xl text-sm font-bold">{t('amb.dispatch')}</button>
          {showForm && (
            <div className="bg-gray-800 p-3 rounded-xl space-y-2">
              <select className="w-full bg-gray-700 p-2 rounded text-sm" value={f.ambulanceId} onChange={e => setF({ ...f, ambulanceId: e.target.value })}>
                <option value="">{t('amb.vehicle')} *</option>
                {vehicles.filter(v => v.status === 'available').map(v => <option key={v._id} value={v._id}>{v.vehicleNo} ({v.type}) - {v.driverName}</option>)}
              </select>
              <div className="flex gap-2">
                <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('amb.patient') + ' *'} value={f.patientName} onChange={e => setF({ ...f, patientName: e.target.value })} />
                <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('amb.phone')} value={f.patientPhone} onChange={e => setF({ ...f, patientPhone: e.target.value })} />
              </div>
              <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('amb.pickup') + ' *'} value={f.pickupLocation} onChange={e => setF({ ...f, pickupLocation: e.target.value })} />
              <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('amb.dest')} value={f.destination} onChange={e => setF({ ...f, destination: e.target.value })} />
              <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('amb.notes')} value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} />
              <button onClick={dispatch} className="w-full bg-blue-600 py-2 rounded-xl text-sm font-bold">{t('common.save')}</button>
            </div>
          )}
        </div>
      )}

      <div className="text-xs font-bold text-gray-400">📡 {t('amb.trips')} ({trips.length})</div>
      <div className="space-y-2">
        {trips.map(tr => (
          <div key={tr._id} className="bg-gray-800 p-3 rounded-xl text-xs">
            <div className="flex justify-between items-center">
              <div className="font-semibold text-sm">🚑 {tr.vehicleNo} <span className="text-gray-500 font-normal">→ {tr.patientName}</span></div>
              <a href={`tel:${tr.driverPhone}`} className="text-xs bg-green-700 px-2 py-1 rounded font-bold">📞 {t('amb.call')}</a>
            </div>
            <div className="text-gray-400 mt-1">📍 {tr.pickupLocation} → {tr.destination}</div>
            {tr.currentLocation && <div className="text-yellow-300 font-bold mt-1">📌 {t('amb.location')}: {tr.currentLocation}</div>}
            <Timeline trip={tr} />
            {mode === 'control' && (
              <div className="mt-2 space-y-2">
                <div className="flex gap-2">
                  <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('amb.location')}
                    value={locEdits[tr._id] || ''} onChange={e => setLocEdits({ ...locEdits, [tr._id]: e.target.value })} />
                  <button onClick={() => setLocation(tr)} className="bg-purple-600 px-3 rounded font-bold">{t('amb.update')}</button>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => advance(tr)} className="flex-1 bg-blue-600 py-1 rounded font-bold">{t('amb.next')}: {STAGE_LABEL(t, STAGES[STAGES.indexOf(tr.status) + 1] || '')} →</button>
                  <button onClick={() => cancel(tr._id)} className="bg-gray-600 px-3 py-1 rounded">✕</button>
                </div>
              </div>
            )}
          </div>
        ))}
        {trips.length === 0 && <p className="text-gray-500 text-xs">{t('amb.no_trips')}</p>}
      </div>
    </div>
  );
}
