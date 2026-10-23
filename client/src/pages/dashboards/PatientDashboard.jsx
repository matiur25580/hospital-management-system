import { useEffect, useState } from 'react';
import DashTopBar from '../../components/DashTopBar';
import api from '../../api';
import CaseCard from '../../components/CaseCard';
import CaseIntakeForm from '../../components/CaseIntakeForm';
import PaymentTracker from '../../components/PaymentTracker';
import HospitalDirectory from '../../components/HospitalDirectory';
import InsuranceClaims from '../../components/InsuranceClaims';
import Telemedicine from '../../components/Telemedicine';
import AmbulanceTracking from '../../components/AmbulanceTracking';
import Feedback from '../../components/Feedback';
import NoticeBoard from '../../components/NoticeBoard';
import DischargeSummary from '../../components/DischargeSummary';
import LabManagement from '../../components/LabManagement';
import PPECompliance from '../../components/PPECompliance';

const FILE_ROOT = (api.defaults.baseURL || 'http://localhost:5000/api').replace(/\/api$/, '');

export default function PatientDashboard({ name }) {
  const [me, setMe] = useState(null);
  const [appts, setAppts] = useState([]);
  const [rx, setRx] = useState([]);
  const [labs, setLabs] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [cases, setCases] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const loadAll = async () => {
    try {
      const { data: u } = await api.get('/admin/me');
      setMe(u);
      const q = { params: { patientEmail: u.email } };
      const [a, p, l, v, cs] = await Promise.all([
        api.get('/appointments', q),
        api.get('/prescriptions', q),
        api.get('/lab-reports', q),
        api.get('/vitals', q),
        api.get('/cases', q),
      ]);
      setAppts(a.data); setRx(p.data); setLabs(l.data); setVitals(v.data); setCases(cs.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    loadAll();
    const t = setInterval(loadAll, 5000);
    const onFocus = () => loadAll();
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(t); window.removeEventListener('focus', onFocus); };
  }, []);

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <DashTopBar />
      <h2 className="text-xl font-bold">Welcome, {me?.name || name}</h2>
      {me?.uniqueId && <p className="text-gray-400 text-sm font-mono">ID: {me.uniqueId}</p>}

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-800 p-4 rounded-xl border-l-4 border-yellow-500">
          <div className="text-2xl font-bold">{appts.length}</div>
          <div className="text-gray-400 text-sm">My Appointments</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border-l-4 border-purple-500">
          <div className="text-2xl font-bold">{rx.length}</div>
          <div className="text-gray-400 text-sm">My Prescriptions</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border-l-4 border-teal-500">
          <div className="text-2xl font-bold">{cases.length}</div>
          <div className="text-gray-400 text-sm">My Cases</div>
        </div>
      </div>

      <button onClick={() => setShowForm(!showForm)} className="w-full bg-blue-600 py-2 rounded-xl font-bold">
        {showForm ? 'Close' : '+ Apply for Treatment'}
      </button>
      {showForm && me && (
        <CaseIntakeForm initialName={me.name} initialEmail={me.email} lockIdentity={true} onSubmitted={loadAll} />
      )}

      <div>
        <h3 className="font-bold mb-2">My Cases ({cases.length})</h3>
        <div className="space-y-2">
          {cases.map(c => <CaseCard key={c._id} c={c} canNote={false} />)}
          {cases.length === 0 && <p className="text-gray-500 text-sm">No cases yet. Apply for treatment above.</p>}
        </div>
      </div>

      <div>
        <h3 className="font-bold mb-2">My Appointments</h3>
        <div className="space-y-2">
          {appts.map(a => (
            <div key={a._id} className="bg-gray-800 p-3 rounded-xl flex justify-between items-center">
              <div>
                <div className="font-semibold">Dr. {a.doctorName}</div>
                <div className="text-gray-400 text-sm">{a.date ? new Date(a.date).toLocaleDateString() : ''} {a.time || ''}</div>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${a.status === 'scheduled' ? 'bg-yellow-700' : a.status === 'completed' ? 'bg-green-700' : 'bg-red-700'}`}>{a.status}</span>
            </div>
          ))}
          {appts.length === 0 && <p className="text-gray-500 text-sm">No appointments yet.</p>}
        </div>
      </div>

      <div>
        <h3 className="font-bold mb-2">My Prescriptions</h3>
        <div className="space-y-2">
          {rx.map(p => (
            <div key={p._id} className="bg-gray-800 p-3 rounded-xl">
              <div className="font-semibold">{p.diagnosis || 'Prescription'}</div>
              <div className="text-gray-400 text-sm">{p.date ? new Date(p.date).toLocaleDateString() : ''}</div>
              <ul className="text-sm mt-1 space-y-1">
                {(p.medicines || []).map((m, i) => (
                  <li key={i} className="text-gray-300">• {m.name} {m.dosage} — {m.frequency}, {m.duration} ({m.timing})</li>
                ))}
              </ul>
            </div>
          ))}
          {rx.length === 0 && <p className="text-gray-500 text-sm">No prescriptions yet.</p>}
        </div>
      </div>

      <div>
        <h3 className="font-bold mb-2">My Lab Reports</h3>
        <div className="space-y-2">
          {labs.map(l => (
            <div key={l._id} className="bg-gray-800 p-3 rounded-xl flex justify-between items-center">
              <div>
                <div className="font-semibold">{l.testName}</div>
                <div className="text-gray-400 text-sm">{l.date ? new Date(l.date).toLocaleDateString() : ''}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-xs px-2 py-1 rounded ${l.status === 'completed' ? 'bg-green-700' : 'bg-yellow-700'}`}>{l.status}</span>
                {l.fileUrl && <a href={FILE_ROOT + l.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 underline">Download</a>}
              </div>
            </div>
          ))}
          {labs.length === 0 && <p className="text-gray-500 text-sm">No lab reports yet.</p>}
        </div>
      </div>

      <div>
        <h3 className="font-bold mb-2">My Vitals</h3>
        <div className="space-y-2">
          {vitals.map(v => (
            <div key={v._id} className="bg-gray-800 p-3 rounded-xl">
              <div className="flex justify-between items-center">
                <div className="font-semibold">{v.date ? new Date(v.date).toLocaleDateString() : ''}</div>
                <span className="text-xs text-gray-500">by {v.recordedBy || 'Nurse'}</span>
              </div>
              <div className="text-gray-400 text-sm">
                {[v.temperature && `Temp ${v.temperature}°F`, v.bp && `BP ${v.bp}`, v.pulse && `Pulse ${v.pulse}`].filter(Boolean).join(' • ') || 'No readings'}
              </div>
            </div>
          ))}
          {vitals.length === 0 && <p className="text-gray-500 text-sm">No vitals recorded yet.</p>}
        </div>
      </div>
          <HospitalDirectory />
      <LabManagement mode="patient" />

      <DischargeSummary mode="patient" />
      <NoticeBoard mode="view" />
      <Feedback mode="patient" />

      <AmbulanceTracking mode="view" />

      <Telemedicine mode="patient" />
      <InsuranceClaims mode="patient" />
      <PPECompliance mode="view" />
</div>
  );
}
