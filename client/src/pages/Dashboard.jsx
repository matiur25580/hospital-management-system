import { useAuth } from '../context/AuthContext';
import DoctorDashboard from './dashboards/DoctorDashboard';
import AdminDashboard from './dashboards/AdminDashboard';
import NurseDashboard from './dashboards/NurseDashboard';
import ReceptionistDashboard from './dashboards/ReceptionistDashboard';
import PatientDashboard from './dashboards/PatientDashboard';

export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role || 'Patient';
  if (role === 'Doctor') return <DoctorDashboard />;
  if (role === 'Admin') return <AdminDashboard />;
  if (role === 'Nurse') return <NurseDashboard />;
  if (role === 'Receptionist') return <ReceptionistDashboard />;
  return <PatientDashboard />;
}
