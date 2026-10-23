import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import CaseCard from '../../components/CaseCard';
import DoctorSchedule from '../../components/DoctorSchedule';
import { useLang } from '../../i18n/LanguageContext.jsx';
import AttendanceMgmt from '../../components/AttendanceMgmt';
import OTBooking from '../../components/OTBooking';
import LabManagement from '../../components/LabManagement';
import DischargeSummary from '../../components/DischargeSummary';
import LeaveManagement from '../../components/LeaveManagement';
import PerformanceAppraisal from '../../components/PerformanceAppraisal';
import IDCard from '../../components/IDCard';
import NoticeBoard from '../../components/NoticeBoard';
import Telemedicine from '../../components/Telemedicine';
import PPECompliance from '../../components/PPECompliance';

const FILE_ROOT = (api.defaults.baseURL || 'http://localhost:5000/api').replace(/\/api$/, '');

export default function DoctorDashboard({ name, initialTab = 'overview', pageMode = false }) {
  const [tab, setTab] = useState(initialTab);
  const navigate = useNavigate();
  const go = (t) => navigate('/doctor/' + t);
  const pageTitle = { overview: 'Overview', appointments: 'Appointments', prescriptions: 'Prescriptions', 'lab-reports': 'Lab Reports', cases: 'Patient Cases', completed: 'Completed', scheduled: 'Scheduled' }[tab] || 'Overview';
  const pageColor = { overview: 'border-green-500', appointments: 'border-yellow-500', prescriptions: 'border-purple-500', 'lab-reports': 'border-red-500', cases: 'border-teal-500', completed: 'border-orange-500', scheduled: 'border-blue-500' }[tab] || 'border-green-500';
  const [appts, setAppts] = useState([]);
  const [rx, setRx] = useState([]);
  const [labs, setLabs] = useState([]);
  const [cases, setCases] = useState([]);
  const [showRx, setShowRx] = useState(false);
  const [showLab, setShowLab] = useState(false);
  const [f, setF] = useState({ patientName: '', patientEmail: '', diagnosis: '' });
  const [meds, setMeds] = useState([{ name: '', dosage: '', frequency: '1+0+1', duration: '', timing: 'After meal' }]);
  const [lab, setLab] = useState({ patientName: '', patientEmail: '', testName: '', result: '' });
  const [labFile, setLabFile] = useState(null);

  const loadAppts = async () => { try { const { data } = await api.get('/appointments'); setAppts(data); } catch (e) { console.error(e); } };
  const loadRx = async () => { try { const { data } = await api.get('/prescriptions'); setRx(data); } catch (e) { console.error(e); } };
  const loadLabs = async () => { try { const { data } = await api.get('/lab-reports'); setLabs(data); } catch (e) { console.error(e); } };
  const loadCases = async () => { try { const { data } = await api.get('/cases'); setCases(data); } catch (e) { console.error(e); } };
  const changeCaseStatus = async (id, payload) => {
    try {
      await api.patch('/cases/' + id + '/status', payload);
      loadCases();
      alert(payload.status === 'discharged' ? 'Patient discharged — bill generated' : 'Case status updated');
    } catch (e) { alert('Failed: ' + (e.response?.data?.message || e.message)); }
  };
  const loadAll = () => { loadAppts(); loadRx(); loadLabs(); loadCases(); };

  useEffect(() => {
    loadAll();
    const t = setInterval(loadAll, 5000);
    const onFocus = () => loadAll();
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(t); window.removeEventListener('focus', onFocus); };
  }, []);

  const completeAppt = async (id) => {
    try { await api.patch(`/appointments/${id}`, { status: 'completed' }); loadAppts(); }
    catch (e) { alert('Failed'); }
  };

  const addMedRow = () => setMeds([...meds, { name: '', dosage: '', frequency: '1+0+1', duration: '', timing: 'After meal' }]);
  const updMed = (i, k, v) => setMeds(meds.map((m, j) => (j === i ? { ...m, [k]: v } : m)));
  const delMedRow = (i) => setMeds(meds.filter((_, j) => j !== i));

  const saveRx = async () => {
    if (!f.patientName.trim() || !f.patientEmail.trim()) { alert('Patient name and email required'); return; }
    const medicines = meds.filter(m => m.name.trim() !== '');
    if (medicines.length === 0) { alert('Add at least one medicine'); return; }
    try {
      await api.post('/prescriptions', { ...f, medicines, doctorName: name });
      setShowRx(false);
      setF({ patientName: '', patientEmail: '', diagnosis: '' });
      setMeds([{ name: '', dosage: '', frequency: '1+0+1', duration: '', timing: 'After meal' }]);
      loadRx();
      alert('Prescription saved');
    } catch (e) { alert('Failed: ' + (e.response?.data?.message || e.message)); }
  };

  const saveLab = async () => {
    if (!lab.patientName.trim() || !lab.patientEmail.trim() || !lab.testName.trim()) { alert('Patient name, email and test name required'); return; }
    try {
      const fd = new FormData();
      fd.append('patientName', lab.patientName);
      fd.append('patientEmail', lab.patientEmail);
      fd.append('testName', lab.testName);
      fd.append('result', lab.result);
      fd.append('status', lab.result.trim() ? 'completed' : 'pending');
      if (labFile) fd.append('file', labFile);
      await api.post('/lab-reports', fd);
      setShowLab(false);
      setLab({ patientName: '', patientEmail: '', testName: '', result: '' });
      setLabFile(null);
      loadLabs();
      alert('Lab report saved');
    } catch (e) { alert('Failed: ' + (e.response?.data?.message || e.message)); }
  };

  const todayCount = appts.filter(a => {
    if (!a.date) return false;
    return new Date(a.date).toDateString() === new Date().toDateString();
  }).length;

  const tabs = ['overview', 'appointments', 'prescriptions', 'lab-reports', 'cases'];

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      {!pageMode && <h2 className="text-xl font-bold">Welcome, Dr. {name}</h2>}

      {pageMode ? (
        <div className="space-y-3">
          <button onClick={() => navigate('/dashboard')} className="text-sm bg-gray-700 px-4 py-2 rounded-full font-bold">← Dashboard</button>
          <div className={`bg-gray-800 p-4 rounded-xl border-l-4 ${pageColor}`}>
            <h2 className="text-2xl font-bold">{pageTitle}</h2>
            <p className="text-gray-400 text-sm">Dr. {name}</p>
          </div>
        </div>
      ) : (
      <div className="flex gap-2 overflow-x-auto">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${tab === t ? 'bg-green-600' : 'bg-gray-700'}`}>
            {t === 'lab-reports' ? 'Lab Reports' : t === 'cases' ? 'Patient Cases' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      )}

      {tab === 'overview' && (
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => go('appointments')} className="bg-gray-800 p-4 rounded-xl border-l-4 border-yellow-500 text-left cursor-pointer active:scale-95 transition hover:bg-gray-700">
            <div className="text-2xl font-bold">{todayCount}</div>
            <div className="text-gray-400 text-sm">Today's Appointments →</div>
          </button>
          <button onClick={() => go('prescriptions')} className="bg-gray-800 p-4 rounded-xl border-l-4 border-purple-500 text-left cursor-pointer active:scale-95 transition hover:bg-gray-700">
            <div className="text-2xl font-bold">{rx.length}</div>
            <div className="text-gray-400 text-sm">Prescriptions →</div>
          </button>
          <button onClick={() => go('lab-reports')} className="bg-gray-800 p-4 rounded-xl border-l-4 border-red-500 text-left cursor-pointer active:scale-95 transition hover:bg-gray-700">
            <div className="text-2xl font-bold">{labs.filter(l => l.status === 'pending').length}</div>
            <div className="text-gray-400 text-sm">Pending Labs →</div>
          </button>
          <button onClick={() => go('scheduled')} className="bg-gray-800 p-4 rounded-xl border-l-4 border-blue-500 text-left cursor-pointer active:scale-95 transition hover:bg-gray-700">
            <div className="text-2xl font-bold">{appts.filter(a => a.status === 'scheduled').length}</div>
            <div className="text-gray-400 text-sm">Scheduled →</div>
          </button>
          <button onClick={() => go('cases')} className="bg-gray-800 p-4 rounded-xl border-l-4 border-teal-500 text-left cursor-pointer active:scale-95 transition hover:bg-gray-700">
            <div className="text-2xl font-bold">{cases.length}</div>
            <div className="text-gray-400 text-sm">Patient Cases →</div>
          </button>
          <button onClick={() => go('completed')} className="bg-gray-800 p-4 rounded-xl border-l-4 border-orange-500 text-left cursor-pointer active:scale-95 transition hover:bg-gray-700">
            <div className="text-2xl font-bold">{appts.filter(a => a.status === 'completed').length}</div>
            <div className="text-gray-400 text-sm">Completed →</div>
          </button>
        </div>
      )}

      {tab === 'appointments' && (
        <div className="space-y-2">
          <h3 className="font-bold">Appointments ({appts.length})</h3>
          {appts.map(a => (
            <div key={a._id} className="bg-gray-800 p-3 rounded-xl">
              <div className="flex justify-between items-center">
                <div className="font-semibold">{a.patient?.name || a.patientName || a.name || '—'}</div>
                <span className={`text-xs px-2 py-1 rounded ${a.status === 'scheduled' ? 'bg-yellow-700' : a.status === 'completed' ? 'bg-green-700' : 'bg-red-700'}`}>{a.status}</span>
              </div>
              <div className="text-gray-400 text-sm">{a.date ? new Date(a.date).toLocaleDateString() : ''} {a.time || ''}</div>
              {a.reason && <div className="text-gray-500 text-sm">{a.reason}</div>}
              {a.status === 'scheduled' && (
                <button onClick={() => completeAppt(a._id)} className="mt-2 text-xs bg-green-700 px-3 py-1 rounded font-bold">✓ Mark Completed</button>
              )}
            </div>
          ))}
          {appts.length === 0 && <p className="text-gray-500 text-sm">No appointments yet.</p>}
        </div>
      )}

      {tab === 'prescriptions' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold">Prescriptions ({rx.length})</h3>
            <button onClick={() => setShowRx(!showRx)} className="bg-green-600 px-4 py-1 rounded-full text-sm font-bold">
              {showRx ? 'Close' : '+ New Prescription'}
            </button>
          </div>
          {showRx && (
            <div className="bg-gray-800 p-4 rounded-xl space-y-2">
              <input className="w-full bg-gray-700 p-2 rounded" placeholder="Patient name"
                value={f.patientName} onChange={e => setF({ ...f, patientName: e.target.value })} />
              <input className="w-full bg-gray-700 p-2 rounded" placeholder="Patient email"
                value={f.patientEmail} onChange={e => setF({ ...f, patientEmail: e.target.value })} />
              <input className="w-full bg-gray-700 p-2 rounded" placeholder="Diagnosis"
                value={f.diagnosis} onChange={e => setF({ ...f, diagnosis: e.target.value })} />
              {meds.map((m, i) => (
                <div key={i} className="bg-gray-700 p-2 rounded space-y-2">
                  <div className="flex gap-2">
                    <input className="flex-1 bg-gray-600 p-2 rounded" placeholder="Medicine name"
                      value={m.name} onChange={e => updMed(i, 'name', e.target.value)} />
                    <input className="w-20 bg-gray-600 p-2 rounded" placeholder="Dose"
                      value={m.dosage} onChange={e => updMed(i, 'dosage', e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <select className="flex-1 bg-gray-600 p-2 rounded" value={m.frequency}
                      onChange={e => updMed(i, 'frequency', e.target.value)}>
                      <option>1+0+1</option><option>1+1+1</option><option>0+0+1</option><option>1+0+0</option>
                    </select>
                    <input className="w-20 bg-gray-600 p-2 rounded" placeholder="Days"
                      value={m.duration} onChange={e => updMed(i, 'duration', e.target.value)} />
                    <select className="flex-1 bg-gray-600 p-2 rounded" value={m.timing}
                      onChange={e => updMed(i, 'timing', e.target.value)}>
                      <option>After meal</option><option>Before meal</option>
                    </select>
                  </div>
                  {meds.length > 1 && (
                    <button onClick={() => delMedRow(i)} className="text-xs text-red-400">Remove</button>
                  )}
                </div>
              ))}
              <button onClick={addMedRow} className="text-sm text-blue-400">+ Add medicine</button>
              <button onClick={saveRx} className="w-full bg-blue-600 py-2 rounded-xl font-bold">Save Prescription</button>
            </div>
          )}
          <div className="space-y-2">
            {rx.map(p => (
              <div key={p._id} className="bg-gray-800 p-3 rounded-xl">
                <div className="font-semibold">{p.patientName || p.name || '—'}</div>
                <div className="text-gray-400 text-sm">Diagnosis: {p.diagnosis || '-'} • {p.date ? new Date(p.date).toLocaleDateString() : ''}</div>
                <ul className="text-sm mt-1 space-y-1">
                  {(p.medicines || []).map((m, i) => (
                    <li key={i} className="text-gray-300">• {m.name} {m.dosage} — {m.frequency}, {m.duration} ({m.timing})</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'lab-reports' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold">Lab Reports ({labs.length})</h3>
            <button onClick={() => setShowLab(!showLab)} className="bg-green-600 px-4 py-1 rounded-full text-sm font-bold">
              {showLab ? 'Close' : '+ New Lab Report'}
            </button>
          </div>
          {showLab && (
            <div className="bg-gray-800 p-4 rounded-xl space-y-2">
              <input className="w-full bg-gray-700 p-2 rounded" placeholder="Patient name"
                value={lab.patientName} onChange={e => setLab({ ...lab, patientName: e.target.value })} />
              <input className="w-full bg-gray-700 p-2 rounded" placeholder="Patient email"
                value={lab.patientEmail} onChange={e => setLab({ ...lab, patientEmail: e.target.value })} />
              <input className="w-full bg-gray-700 p-2 rounded" placeholder="Test name"
                value={lab.testName} onChange={e => setLab({ ...lab, testName: e.target.value })} />
              <textarea className="w-full bg-gray-700 p-2 rounded" placeholder="Result (optional)"
                value={lab.result} onChange={e => setLab({ ...lab, result: e.target.value })} />
              <div>
                <label className="text-sm text-gray-400">Attach report file (PDF/image)</label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="w-full bg-gray-700 p-2 rounded text-sm"
                  onChange={e => setLabFile(e.target.files[0] || null)} />
                {labFile && <div className="text-xs text-gray-400 mt-1">Selected: {labFile.name}</div>}
              </div>
              <button onClick={saveLab} className="w-full bg-blue-600 py-2 rounded-xl font-bold">Save Lab Report</button>
            </div>
          )}
          <div className="space-y-2">
            {labs.map(l => (
              <div key={l._id} className="bg-gray-800 p-3 rounded-xl">
                <div className="flex justify-between items-center">
                  <div className="font-semibold">{l.testName}</div>
                  <span className={`text-xs px-2 py-1 rounded ${l.status === 'completed' ? 'bg-green-700' : 'bg-yellow-700'}`}>{l.status}</span>
                </div>
                <div className="text-gray-400 text-sm">{l.patientName || l.name || '—'} • {l.date ? new Date(l.date).toLocaleDateString() : ''}</div>
                {l.result && <div className="text-gray-300 text-sm mt-1">{l.result}</div>}
                {l.fileUrl && <a href={FILE_ROOT + l.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 underline">Download file</a>}
              </div>
            ))}
            {labs.length === 0 && <p className="text-gray-500 text-sm">No lab reports yet.</p>}
          </div>
        </div>
      )}

      {tab === 'cases' && (
        <div className="space-y-2">
          <h3 className="font-bold">Patient Cases ({cases.length})</h3>
          <p className="text-gray-500 text-sm">Add your clinical description to a case — the case PDF regenerates and the patient sees it instantly.</p>
          {cases.map(c => (
            <CaseCard key={c._id} c={c} canNote={true} authorName={name} role="Doctor" onNoteSaved={loadCases} canStatus={true} onStatusChanged={changeCaseStatus} />
          ))}
          {cases.length === 0 && <p className="text-gray-500 text-sm">No patient cases yet.</p>}
        </div>
      )}
      {tab === 'completed' && (
        <div className="space-y-2">
          <h3 className="font-bold">Completed Appointments ({appts.filter(a => a.status === 'completed').length})</h3>
          {appts.filter(a => a.status === 'completed').map(a => (
            <div key={a._id} className="bg-gray-800 p-3 rounded-xl">
              <div className="flex justify-between items-center">
                <div className="font-semibold">{a.patient?.name || a.patientName || a.name || '—'}</div>
                <span className="text-xs px-2 py-1 rounded bg-green-700">{a.status}</span>
              </div>
              <div className="text-gray-400 text-sm">{a.date ? new Date(a.date).toLocaleDateString() : ''} {a.time || ''}</div>
              {a.reason && <div className="text-gray-500 text-sm">{a.reason}</div>}
            </div>
          ))}
          {appts.filter(a => a.status === 'completed').length === 0 && <p className="text-gray-500 text-sm">No completed appointments yet.</p>}
        </div>
      )}
      {tab === 'scheduled' && (
        <div className="space-y-2">
          <h3 className="font-bold">Scheduled Appointments ({appts.filter(a => a.status === 'scheduled').length})</h3>
          {appts.filter(a => a.status === 'scheduled').map(a => (
            <div key={a._id} className="bg-gray-800 p-3 rounded-xl">
              <div className="flex justify-between items-center">
                <div className="font-semibold">{a.patient?.name || a.patientName || a.name || '—'}</div>
                <span className="text-xs px-2 py-1 rounded bg-yellow-700">{a.status}</span>
              </div>
              <div className="text-gray-400 text-sm">{a.date ? new Date(a.date).toLocaleDateString() : ''} {a.time || ''}</div>
              {a.reason && <div className="text-gray-500 text-sm">{a.reason}</div>}
              <button onClick={() => completeAppt(a._id)} className="mt-2 text-xs bg-green-700 px-3 py-1 rounded font-bold">✓ Mark Completed</button>
            </div>
          ))}
          {appts.filter(a => a.status === 'scheduled').length === 0 && <p className="text-gray-500 text-sm">No scheduled appointments.</p>}
        </div>
      )}
      {!pageMode && (<>
      <DoctorSchedule />
          <AttendanceMgmt mode="staff" />
      <LeaveManagement mode="staff" />

      <PerformanceAppraisal mode="staff" />
      <IDCard mode="staff" />
      <NoticeBoard mode="view" />
      <Telemedicine mode="doctor" />
      </>)}
      <PPECompliance mode="view" />
</div>
  );
}
