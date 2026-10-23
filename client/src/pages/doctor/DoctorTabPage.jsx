import { useParams } from 'react-router-dom';
import DoctorDashboard from '../dashboards/DoctorDashboard';

const VALID = ['overview', 'appointments', 'prescriptions', 'lab-reports', 'cases', 'completed', 'scheduled'];

function getName() {
  try {
    const u = JSON.parse(sessionStorage.getItem('hms_user') || '{}');
    return u.name || u.fullName || '';
  } catch { return ''; }
}

export default function DoctorTabPage() {
  const { tab } = useParams();
  const t = VALID.includes(tab) ? tab : 'overview';
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <DoctorDashboard key={t} name={getName()} initialTab={t} pageMode />
    </div>
  );
}
