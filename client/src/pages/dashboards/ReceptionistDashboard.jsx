import { useEffect, useState } from 'react';
import DashTopBar from '../../components/DashTopBar';
import api from '../../api';
import CaseCard from '../../components/CaseCard';
import CaseIntakeForm from '../../components/CaseIntakeForm';
import BedManagement from '../../components/BedManagement';
import PaymentTracker from '../../components/PaymentTracker';
import Pharmacy from '../../components/Pharmacy';
import AmbulanceMgmt from '../../components/AmbulanceMgmt';
import AttendanceMgmt from '../../components/AttendanceMgmt';
import HospitalDirectory from '../../components/HospitalDirectory';
import AmbulanceTracking from '../../components/AmbulanceTracking';
import NoticeBoard from '../../components/NoticeBoard';
import VisitorPass from '../../components/VisitorPass';
import IDCard from '../../components/IDCard';
import PerformanceAppraisal from '../../components/PerformanceAppraisal';
import LeaveManagement from '../../components/LeaveManagement';
import LabManagement from '../../components/LabManagement';
import BloodBank from '../../components/BloodBank';
import DutyRoster from '../../components/DutyRoster';
import PPECompliance from '../../components/PPECompliance';

export default function ReceptionistDashboard({ name }) {
  const [appts, setAppts] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [cases, setCases] = useState([]);
  const [show, setShow] = useState(false);
  const [showCase, setShowCase] = useState(false);
  const [f, setF] = useState({ patientName: '', patientEmail: '', date: '', time: '', reason: '', doctorName: '' });

  const load = async () => {
    try {
      const { data } = await api.get('/appointments');
      setAppts(data);
    } catch (e) { console.error(e); }
  };
  const loadCases = async () => {
    try { const { data } = await api.get('/cases'); setCases(data); }
    catch (e) { console.error(e); }
  };
  const changeCaseStatus = async (id, payload) => {
    try {
      await api.patch('/cases/' + id + '/status', payload);
      loadCases();
      alert(payload.status === 'discharged' ? 'Patient discharged — bill generated' : 'Case status updated');
    } catch (e) { alert('Failed: ' + (e.response?.data?.message || e.message)); }
  };

  useEffect(() => {
    load(); loadCases();
    (async () => {
      try {
        const { data } = await api.get('/admin/users?role=Doctor');
        setDoctors(data);
      } catch (e) { console.error(e); }
    })();
    const t = setInterval(() => { load(); loadCases(); }, 5000);
    return () => clearInterval(t);
  }, []);

  const book = async () => {
    if (!f.patientName.trim() || !f.patientEmail.trim() || !f.date || !f.doctorName) {
      alert('Patient name, email, date and doctor required'); return;
    }
    try {
      // availability pre-check (backend also enforces)
      try {
        const _cd = (f.doctorEmail || f.doctor || '');
        const _ct = (f.date || f.appointmentDate || '');
        if (_cd && _ct) {
          const _chk = await api.get('/schedules/check?doctorEmail=' + encodeURIComponent(_cd) + '&date=' + _ct);
          if (!_chk.data.available) { alert('Cannot book: ' + _chk.data.reason); return; }
        }
      } catch (_e) { console.error('pre-check failed:', _e.message); }
      await api.post('/appointments', { ...f, status: 'scheduled' });
      setShow(false);
      setF({ patientName: '', patientEmail: '', date: '', time: '', reason: '', doctorName: '' });
      load();
      alert('Appointment booked');
    } catch (e) { alert('Failed: ' + (e.response?.data?.message || e.message)); }
  };

  const cancelAppt = async (id) => {
    if (!confirm('Cancel this appointment?')) return;
    try {
      await api.patch(`/appointments/${id}`, { status: 'cancelled' });
      load();
    } catch (e) { alert('Failed'); }
  };

  const todayCount = appts.filter(a => {
    if (!a.date) return false;
    return new Date(a.date).toDateString() === new Date().toDateString();
  }).length;

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <DashTopBar />
      <h2 className="text-xl font-bold">Welcome, {name} (Receptionist)</h2>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-800 p-4 rounded-xl border-l-4 border-yellow-500">
          <div className="text-2xl font-bold">{todayCount}</div>
          <div className="text-gray-400 text-sm">Today's Appointments</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border-l-4 border-blue-500">
          <div className="text-2xl font-bold">{appts.filter(a => a.status === 'scheduled').length}</div>
          <div className="text-gray-400 text-sm">Scheduled</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border-l-4 border-teal-500">
          <div className="text-2xl font-bold">{cases.length}</div>
          <div className="text-gray-400 text-sm">Patient Cases</div>
        </div>
      </div>

      <button onClick={() => setShow(!show)} className="w-full bg-green-600 py-2 rounded-xl font-bold">
        {show ? 'Close' : '+ Book Appointment'}
      </button>
      {show && (
        <div className="bg-gray-800 p-4 rounded-xl space-y-2">
          <input className="w-full bg-gray-700 p-2 rounded" placeholder="Patient name"
            value={f.patientName} onChange={e => setF({ ...f, patientName: e.target.value })} />
          <input className="w-full bg-gray-700 p-2 rounded" placeholder="Patient email"
            value={f.patientEmail} onChange={e => setF({ ...f, patientEmail: e.target.value })} />
          <select className="w-full bg-gray-700 p-2 rounded" value={f.doctorName}
            onChange={e => setF({ ...f, doctorName: e.target.value })}>
            <option value="">Select doctor</option>
            {doctors.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
          </select>
          <div className="flex gap-2">
            <input type="date" className="flex-1 bg-gray-700 p-2 rounded"
              value={f.date} onChange={e => setF({ ...f, date: e.target.value })} />
            <input type="time" className="flex-1 bg-gray-700 p-2 rounded"
              value={f.time} onChange={e => setF({ ...f, time: e.target.value })} />
          </div>
          <input className="w-full bg-gray-700 p-2 rounded" placeholder="Reason"
            value={f.reason} onChange={e => setF({ ...f, reason: e.target.value })} />
          <button onClick={book} className="w-full bg-blue-600 py-2 rounded-xl font-bold">Confirm Booking</button>
        </div>
      )}

      <div>
        <h3 className="font-bold mb-2">Appointments ({appts.length})</h3>
        <div className="space-y-2">
          {appts.map(a => (
            <div key={a._id} className="bg-gray-800 p-3 rounded-xl">
              <div className="flex justify-between items-center">
                <div className="font-semibold">{a.patientName}</div>
                <span className={`text-xs px-2 py-1 rounded ${a.status === 'scheduled' ? 'bg-yellow-700' : a.status === 'completed' ? 'bg-green-700' : 'bg-red-700'}`}>{a.status}</span>
              </div>
              <div className="text-gray-400 text-sm">Dr. {a.doctorName} • {a.date ? new Date(a.date).toLocaleDateString() : ''} {a.time || ''}</div>
              {a.status === 'scheduled' && (
                <button onClick={() => cancelAppt(a._id)} className="mt-2 text-xs bg-red-700 px-3 py-1 rounded">Cancel</button>
              )}
            </div>
          ))}
          {appts.length === 0 && <p className="text-gray-500 text-sm">No appointments yet.</p>}
        </div>
      </div>

      <BedManagement mode="receptionist" userName={name} />

      <PaymentTracker mode="staff" userName={name} />

      <Pharmacy mode="staff" userName={name} />

      <AmbulanceMgmt mode="staff" userName={name} />

      <AttendanceMgmt mode="staff" />

      <HospitalDirectory />

      <DutyRoster mode="staff" />

      <BloodBank mode="staff" />

      <LabManagement mode="staff" />

      <LeaveManagement mode="staff" />

      <PerformanceAppraisal mode="staff" />

      <IDCard mode="staff" />

      <VisitorPass />

      <NoticeBoard mode="view" />

      <AmbulanceTracking mode="control" />


      <button onClick={() => setShowCase(!showCase)} className="w-full bg-teal-600 py-2 rounded-xl font-bold">
        {showCase ? 'Close' : '+ Register Patient Case (Walk-in)'}
      </button>
      {showCase && <CaseIntakeForm onSubmitted={loadCases} />}

      <div>
        <h3 className="font-bold mb-2">Patient Cases ({cases.length})</h3>
        <div className="space-y-2">
          {cases.map(c => <CaseCard key={c._id} c={c} canNote={false} canStatus={true} onStatusChanged={changeCaseStatus} />)}
          {cases.length === 0 && <p className="text-gray-500 text-sm">No patient cases yet.</p>}
        </div>
      </div>
          <PPECompliance mode="admin" />
</div>
  );
}
