import { useEffect, useState } from 'react';
import DashTopBar from '../../components/DashTopBar';
import api from '../../api';
import CaseCard from '../../components/CaseCard';
import AttendanceMgmt from '../../components/AttendanceMgmt';
import NoticeBoard from '../../components/NoticeBoard';
import IDCard from '../../components/IDCard';
import DutyRoster from '../../components/DutyRoster';
import LeaveManagement from '../../components/LeaveManagement';
import PPECompliance from '../../components/PPECompliance';
import CleaningSchedule from '../../components/CleaningSchedule';

export default function NurseDashboard({ name }) {
  const [vitals, setVitals] = useState([]);
  const [patients, setPatients] = useState([]);
  const [cases, setCases] = useState([]);
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ patientName: '', patientEmail: '', temperature: '', bp: '', pulse: '' });

  const load = async () => {
    try {
      const { data } = await api.get('/vitals');
      setVitals(data);
    } catch (e) { console.error(e); }
  };
  const loadCases = async () => {
    try { const { data } = await api.get('/cases'); setCases(data); }
    catch (e) { console.error(e); }
  };

  useEffect(() => {
    load(); loadCases();
    (async () => {
      try {
        const { data } = await api.get('/admin/users?role=Patient');
        setPatients(data);
      } catch (e) { console.error(e); }
    })();
    const t = setInterval(() => { load(); loadCases(); }, 5000);
    return () => clearInterval(t);
  }, []);

  const save = async () => {
    if (!f.patientName.trim() || !f.patientEmail.trim()) { alert('Patient name and email required'); return; }
    try {
      await api.post('/vitals', { ...f, recordedBy: name });
      setShow(false);
      setF({ patientName: '', patientEmail: '', temperature: '', bp: '', pulse: '' });
      load();
      alert('Vitals recorded');
    } catch (e) { alert('Failed: ' + (e.response?.data?.message || e.message)); }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <DashTopBar />
      <h2 className="text-xl font-bold">Welcome, {name} (Nurse)</h2>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-800 p-4 rounded-xl border-l-4 border-red-500">
          <div className="text-2xl font-bold">{vitals.length}</div>
          <div className="text-gray-400 text-sm">Vitals Recorded</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border-l-4 border-blue-500">
          <div className="text-2xl font-bold">{patients.length}</div>
          <div className="text-gray-400 text-sm">Patients</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border-l-4 border-teal-500">
          <div className="text-2xl font-bold">{cases.length}</div>
          <div className="text-gray-400 text-sm">Patient Cases</div>
        </div>
      </div>

      <button onClick={() => setShow(!show)} className="w-full bg-green-600 py-2 rounded-xl font-bold">
        {show ? 'Close' : '+ Record Vitals'}
      </button>
      {show && (
        <div className="bg-gray-800 p-4 rounded-xl space-y-2">
          <input className="w-full bg-gray-700 p-2 rounded" placeholder="Patient name"
            value={f.patientName} onChange={e => setF({ ...f, patientName: e.target.value })} />
          <input className="w-full bg-gray-700 p-2 rounded" placeholder="Patient email"
            value={f.patientEmail} onChange={e => setF({ ...f, patientEmail: e.target.value })} />
          <div className="flex gap-2">
            <input className="flex-1 bg-gray-700 p-2 rounded" placeholder="Temp (°F)"
              value={f.temperature} onChange={e => setF({ ...f, temperature: e.target.value })} />
            <input className="flex-1 bg-gray-700 p-2 rounded" placeholder="BP (120/80)"
              value={f.bp} onChange={e => setF({ ...f, bp: e.target.value })} />
            <input className="flex-1 bg-gray-700 p-2 rounded" placeholder="Pulse"
              value={f.pulse} onChange={e => setF({ ...f, pulse: e.target.value })} />
          </div>
          <button onClick={save} className="w-full bg-blue-600 py-2 rounded-xl font-bold">Save Vitals</button>
        </div>
      )}

      <div>
        <h3 className="font-bold mb-2">Vitals History ({vitals.length})</h3>
        <div className="space-y-2">
          {vitals.map(v => (
            <div key={v._id} className="bg-gray-800 p-3 rounded-xl">
              <div className="flex justify-between items-center">
                <div className="font-semibold">{v.patientName}</div>
                <span className="text-xs text-gray-500">{v.date ? new Date(v.date).toLocaleDateString() : ''}</span>
              </div>
              <div className="text-gray-400 text-sm">
                {[v.temperature && `Temp ${v.temperature}°F`, v.bp && `BP ${v.bp}`, v.pulse && `Pulse ${v.pulse}`].filter(Boolean).join(' • ') || 'No readings'}
              </div>
            </div>
          ))}
          {vitals.length === 0 && <p className="text-gray-500 text-sm">No vitals recorded yet.</p>}
        </div>
      </div>

      <div>
        <h3 className="font-bold mb-2">Patient Cases ({cases.length})</h3>
        <p className="text-gray-500 text-sm mb-2">Review cases and add nursing notes — the case PDF updates for doctor and patient too.</p>
        <div className="space-y-2">
          {cases.map(c => (
            <CaseCard key={c._id} c={c} canNote={true} authorName={name} role="Nurse" onNoteSaved={loadCases} />
          ))}
          {cases.length === 0 && <p className="text-gray-500 text-sm">No patient cases yet.</p>}
        </div>
      </div>
          <AttendanceMgmt mode="staff" />
      <NoticeBoard mode="view" />

      <IDCard mode="staff" />

      <DutyRoster mode="staff" />

      <LeaveManagement mode="staff" />
      <PPECompliance mode="view" />
      <CleaningSchedule mode="view" />
</div>
  );
}
