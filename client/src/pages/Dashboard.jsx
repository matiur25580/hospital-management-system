import { useAuth } from '../context/AuthContext';

const CONFIG = {
  Admin: { title: 'Admin Dashboard', color: '#4f8cff',
    stats: [['Total Doctors','24'],['Total Patients','312'],['Appointments Today','48'],['Monthly Revenue','₹4.2L']],
    actions: ['Manage Staff','View All Appointments','Billing Overview','Hospital Settings'] },
  Doctor: { title: 'Doctor Dashboard', color: '#22c55e',
    stats: [["Today's Appointments",'12'],['Patients Under Care','35'],['Pending Reports','6'],['Surgeries This Week','3']],
    actions: ['My Appointments','Patient Records','Write Prescription','Lab Reports'] },
  Nurse: { title: 'Nurse Dashboard', color: '#f59e0b',
    stats: [['Assigned Patients','18'],['Vitals Due','7'],['Medications Due','11'],['Ward Occupancy','82%']],
    actions: ['Patient Vitals','Medication Chart','Ward Rounds','Assist Doctor'] },
  Receptionist: { title: 'Receptionist Dashboard', color: '#a855f7',
    stats: [["Today's Bookings",'48'],['Walk-in Patients','15'],['Pending Bills','9'],['Available Beds','23']],
    actions: ['Book Appointment','Register Patient','Billing Counter','Bed Management'] },
  Patient: { title: 'Patient Dashboard', color: '#ec4899',
    stats: [['Upcoming Appointments','2'],['Prescriptions','5'],['Lab Reports','3'],['Pending Bills','₹1,200']],
    actions: ['Book Appointment','My Prescriptions','Lab Reports','Download Bills'] },
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const role = user?.role || 'Patient';
  const c = CONFIG[role] || CONFIG.Patient;
  const st = { minHeight:'100vh', background:'#0d1117', color:'#fff', fontFamily:'system-ui', padding:20 };
  return (
    <div style={st}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
        <div>
          <h2 style={{margin:0}}>🏥 {c.title}</h2>
          <p style={{color:'#8b949e',margin:'4px 0 0'}}>Welcome, {user?.name || 'User'} ({role})</p>
        </div>
        <button onClick={logout} style={{background:'#dc2626',color:'#fff',border:'none',borderRadius:8,padding:'10px 18px',cursor:'pointer'}}>Logout</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:14,marginBottom:28}}>
        {c.stats.map(([label,val]) => (
          <div key={label} style={{background:'#161b22',border:`1px solid ${c.color}55`,borderRadius:12,padding:16}}>
            <div style={{fontSize:26,fontWeight:700,color:c.color}}>{val}</div>
            <div style={{color:'#8b949e',fontSize:13,marginTop:4}}>{label}</div>
          </div>
        ))}
      </div>
      <h3 style={{marginBottom:12}}>Quick Actions</h3>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:14}}>
        {c.actions.map(a => (
          <button key={a} style={{background:'#161b22',border:'1px solid #30363d',color:'#fff',borderRadius:12,padding:20,cursor:'pointer',fontSize:14}}>{a}</button>
        ))}
      </div>
    </div>
  );
}
