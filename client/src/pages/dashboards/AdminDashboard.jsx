import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashTopBar from '../../components/DashTopBar';
import api from '../../api';
import CaseCard from '../../components/CaseCard';
import Analytics from '../../components/Analytics';
import BedManagement from '../../components/BedManagement';
import PaymentTracker from '../../components/PaymentTracker';
import Pharmacy from '../../components/Pharmacy';
import AmbulanceMgmt from '../../components/AmbulanceMgmt';
import AttendanceMgmt from '../../components/AttendanceMgmt';
import HospitalDirectory from '../../components/HospitalDirectory';
import InsuranceClaims from '../../components/InsuranceClaims';
import AmbulanceTracking from '../../components/AmbulanceTracking';
import Feedback from '../../components/Feedback';
import NoticeBoard from '../../components/NoticeBoard';
import InventoryMgmt from '../../components/InventoryMgmt';
import VisitorPass from '../../components/VisitorPass';
import IDCard from '../../components/IDCard';
import Recruitment from '../../components/Recruitment';
import PerformanceAppraisal from '../../components/PerformanceAppraisal';
import LeaveManagement from '../../components/LeaveManagement';
import OrgHierarchy from '../../components/OrgHierarchy';
import SalaryManagement from '../../components/SalaryManagement';
import DischargeSummary from '../../components/DischargeSummary';
import LabManagement from '../../components/LabManagement';
import BloodBank from '../../components/BloodBank';
import OTBooking from '../../components/OTBooking';
import DutyRoster from '../../components/DutyRoster';
import PPECompliance from '../../components/PPECompliance';
import CleaningSchedule from '../../components/CleaningSchedule';
import AdminOverview from '../../components/AdminOverview';

export default function AdminDashboard({ name }) {
  const [stats, setStats] = useState({ totalUsers: 0, doctors: 0, nurses: 0, receptionists: 0, patients: 0, todayAppts: 0, pendingLabs: 0 });
  const [users, setUsers] = useState([]);
  const [cases, setCases] = useState([]);
  const [role, setRole] = useState('All');

  const loadStats = async () => {
    try {
      const { data: u } = await api.get('/admin/users');
      const { data: a } = await api.get('/appointments');
      const { data: l } = await api.get('/lab-reports');
      const { data: cs } = await api.get('/cases');
      const today = new Date().toDateString();
      setStats({
        totalUsers: u.length,
        doctors: u.filter(x => x.role === 'Doctor').length,
        nurses: u.filter(x => x.role === 'Nurse').length,
        receptionists: u.filter(x => x.role === 'Receptionist').length,
        patients: u.filter(x => x.role === 'Patient').length,
        todayAppts: a.filter(x => x.date && new Date(x.date).toDateString() === today).length,
        pendingLabs: l.filter(x => x.status === 'pending').length,
      });
      setCases(cs);
      setUsers(role === 'All' ? u : u.filter(x => x.role === role));
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    loadStats();
    const t = setInterval(loadStats, 5000);
    const onFocus = () => loadStats();
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(t); window.removeEventListener('focus', onFocus); };
  }, [role]);

  const roles = ['All', 'Admin', 'Doctor', 'Nurse', 'Receptionist', 'Patient'];

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <DashTopBar />
      <AdminOverview />
      <h2 className="text-xl font-bold">Welcome, {name} (Admin)</h2>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800 p-4 rounded-xl border-l-4 border-blue-500">
          <div className="text-2xl font-bold">{stats.totalUsers}</div>
          <div className="text-gray-400 text-sm">Total Users</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border-l-4 border-green-500">
          <div className="text-2xl font-bold">{stats.doctors}</div>
          <div className="text-gray-400 text-sm">Doctors</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border-l-4 border-red-500">
          <div className="text-2xl font-bold">{stats.nurses}</div>
          <div className="text-gray-400 text-sm">Nurses</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border-l-4 border-yellow-500">
          <div className="text-2xl font-bold">{stats.receptionists}</div>
          <div className="text-gray-400 text-sm">Receptionists</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border-l-4 border-purple-500">
          <div className="text-2xl font-bold">{stats.patients}</div>
          <div className="text-gray-400 text-sm">Patients</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border-l-4 border-teal-500">
          <div className="text-2xl font-bold">{cases.length}</div>
          <div className="text-gray-400 text-sm">Patient Cases</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border-l-4 border-orange-500">
          <div className="text-2xl font-bold">{stats.todayAppts}</div>
          <div className="text-gray-400 text-sm">Today's Appointments</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border-l-4 border-pink-500">
          <div className="text-2xl font-bold">{stats.pendingLabs}</div>
          <div className="text-gray-400 text-sm">Pending Labs</div>
        </div>
      </div>

      <div>
        <h3 className="font-bold mb-2">Quick Links</h3>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <Link to="/lab-reports" className="bg-gray-800 p-3 rounded-xl text-center border-l-4 border-cyan-500 hover:bg-gray-700">
            <div className="text-xl">🧪</div>
            <div className="text-sm font-semibold">Lab Reports</div>
          </Link>
          <Link to="/pharmacy" className="bg-gray-800 p-3 rounded-xl text-center border-l-4 border-green-500 hover:bg-gray-700">
            <div className="text-xl">💊</div>
            <div className="text-sm font-semibold">Pharmacy</div>
          </Link>
          <Link to="/ambulance" className="bg-gray-800 p-3 rounded-xl text-center border-l-4 border-red-500 hover:bg-gray-700">
            <div className="text-xl">🚑</div>
            <div className="text-sm font-semibold">Ambulance</div>
          </Link>
        </div>
      </div>

      <div>
        <h3 className="font-bold mb-2">Users</h3>
        <div className="flex gap-2 overflow-x-auto mb-2">
          {roles.map(r => (
            <button key={r} onClick={() => setRole(r)}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${role === r ? 'bg-blue-600' : 'bg-gray-700'}`}>
              {r}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {users.map(u => (
            <div key={u._id} className="bg-gray-800 p-3 rounded-xl flex justify-between items-center">
              <div>
                <div className="font-semibold">{u.name}</div>
                <div className="text-gray-400 text-sm">{u.email}</div>
                {u.uniqueId && <div className="text-gray-500 text-xs font-mono">{u.uniqueId}</div>}
              </div>
              <span className="text-xs px-2 py-1 rounded bg-gray-700">{u.role}</span>
            </div>
          ))}
          {users.length === 0 && <p className="text-gray-500 text-sm">No users found.</p>}
        </div>
      </div>

      <Analytics />

      <BedManagement mode="admin" userName={name} />

      <PaymentTracker mode="staff" userName={name} />

      <Pharmacy mode="admin" userName={name} />

      <AmbulanceMgmt mode="admin" userName={name} />

      <AttendanceMgmt mode="admin" />

      <HospitalDirectory />

      <DutyRoster mode="admin" />

      <OTBooking mode="admin" />

      <BloodBank mode="admin" />

      <LabManagement mode="admin" />

      <DischargeSummary mode="admin" />

      <OrgHierarchy />

      <SalaryManagement />

      <LeaveManagement mode="hr" />

      <PerformanceAppraisal mode="hr" />

      <Recruitment />

      <IDCard mode="admin" />

      <VisitorPass />

      <InventoryMgmt />

      <NoticeBoard mode="admin" />

      <Feedback mode="admin" />

      <AmbulanceTracking mode="control" />

      <InsuranceClaims mode="admin" />


      <div>
        <h3 className="font-bold mb-2">Patient Cases ({cases.length})</h3>
        <div className="space-y-2">
          {cases.map(c => <CaseCard key={c._id} c={c} canNote={false} />)}
          {cases.length === 0 && <p className="text-gray-500 text-sm">No patient cases yet.</p>}
        </div>
      </div>
          <PPECompliance mode="admin" />
      <CleaningSchedule mode="admin" />
</div>
  );
}
