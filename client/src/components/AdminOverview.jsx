import { useEffect, useState } from 'react';
import api from '../api';

export default function AdminOverview() {
  const [stats, setStats] = useState({ doctors: '–', patients: '–', beds: '–', appointments: '–' });
  const [online, setOnline] = useState(false);

  useEffect(() => {
    (async () => {
      const get = async (url) => { try { const r = await api.get(url); return r.data; } catch { return null; } };
      const [doctors, patients, beds, appointments] = await Promise.all([
        get('/doctors'), get('/patients'), get('/beds'), get('/appointments')
      ]);
      const today = new Date().toISOString().slice(0, 10);
      setStats({
        doctors: Array.isArray(doctors) ? doctors.length : '–',
        patients: Array.isArray(patients) ? patients.length : '–',
        beds: Array.isArray(beds)
          ? `${beds.filter(b => /occup/i.test(b.status || '')).length}/${beds.length}` : '–',
        appointments: Array.isArray(appointments)
          ? appointments.filter(a => (a.date || '').slice(0, 10) === today).length : '–',
      });
      setOnline(!!(doctors || patients || beds || appointments));
    })();
  }, []);

  const cards = [
    { icon: '👨‍⚕️', label: 'Doctors', value: stats.doctors, color: 'from-blue-500 to-blue-600' },
    { icon: '🧑‍🤝‍🧑', label: 'Patients', value: stats.patients, color: 'from-emerald-500 to-emerald-600' },
    { icon: '🛏️', label: 'Beds (occupied / total)', value: stats.beds, color: 'from-amber-500 to-amber-600' },
    { icon: '📅', label: "Today's Appointments", value: stats.appointments, color: 'from-violet-500 to-violet-600' },
  ];

  return (
    <div className="mb-6">
      <div className="rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">🏥 Hospital Command Center</h2>
            <p className="mt-1 text-sm text-blue-100">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · Admin Dashboard
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur">🎯 ABDM Roadmap: Phase 0</span>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${online ? 'bg-emerald-300 text-emerald-950' : 'bg-red-300 text-red-950'}`}>
              {online ? '🟢 API Online' : '🔴 API Offline'}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c, i) => (
          <div key={i} className="rounded-xl border border-gray-100 bg-white p-5 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg">
            <div className={`inline-flex rounded-lg bg-gradient-to-br ${c.color} p-2.5 text-xl`}>{c.icon}</div>
            <div className="mt-3 text-3xl font-bold text-gray-800">{c.value}</div>
            <div className="text-sm text-gray-500">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
