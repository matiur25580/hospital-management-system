import {useEffect,useState} from 'react'
import {useNavigate,Link} from 'react-router-dom'
import API from '../api'
export default function Dashboard(){
 const nav=useNavigate()
 const user=JSON.parse(sessionStorage.getItem('user')||'{}')
 const [patients,setPatients]=useState([])
 const [doctors,setDoctors]=useState([])
 const [appointments,setAppointments]=useState([])
 useEffect(()=>{
  if(!sessionStorage.getItem('token')){nav('/login');return}
  API.get('/patients').then(r=>setPatients(Array.isArray(r.data)?r.data:[])).catch(()=>{})
  API.get('/doctors').then(r=>setDoctors(Array.isArray(r.data)?r.data:[])).catch(()=>{})
  API.get('/appointments').then(r=>setAppointments(Array.isArray(r.data)?r.data:[])).catch(()=>{})
 },[])
 const logout=()=>{sessionStorage.clear();nav('/login')}
 const role=String(user.role||'').toLowerCase()
 const card={background:'#fff',borderRadius:12,padding:20,textAlign:'center',boxShadow:'0 1px 4px rgba(0,0,0,.08)'}
 const btn={display:'inline-block',padding:'12px 20px',background:'#2563eb',color:'#fff',borderRadius:8,textDecoration:'none',fontWeight:600}
 return(
  <div style={{minHeight:'100vh',background:'#f1f5f9',padding:24}}>
   <h1 style={{textAlign:'center',margin:'8px 0'}}>Welcome, {user.name||user.role||'User'}</h1>
   <p style={{textAlign:'center'}}><span style={{background:'#dbeafe',color:'#1d4ed8',padding:'4px 14px',borderRadius:20,fontWeight:600}}>{user.role}</span></p>
   <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginTop:16}}>
    <div style={card}><div style={{color:'#64748b'}}>Total Patients</div><h2 style={{fontSize:36,margin:'8px 0'}}>{patients.length}</h2></div>
    <div style={card}><div style={{color:'#64748b'}}>Total Doctors</div><h2 style={{fontSize:36,margin:'8px 0'}}>{doctors.length}</h2></div>
    <div style={card}><div style={{color:'#64748b'}}>Total Appointments</div><h2 style={{fontSize:36,margin:'8px 0'}}>{appointments.length}</h2></div>
   </div>
   <div style={{display:'flex',gap:12,marginTop:20,flexWrap:'wrap',justifyContent:'center'}}>
    {role==='admin'&&<><Link to='/patients' style={btn}>Patients</Link><Link to='/appointments' style={btn}>Appointments</Link><Link to='/beds' style={btn}>Beds</Link></>}
    {role==='doctor'&&<><Link to='/appointments' style={btn}>My Appointments</Link><Link to='/patients' style={btn}>My Patients</Link></>}
    {role==='receptionist'&&<><Link to='/patients' style={btn}>Patients</Link><Link to='/appointments' style={btn}>Appointments</Link><Link to='/beds' style={btn}>Beds</Link></>}
   </div>
   <div style={{textAlign:'center',marginTop:28}}><button onClick={logout} style={{padding:'10px 28px',background:'#64748b',color:'#fff',border:'none',borderRadius:8,fontSize:16}}>Logout</button></div>
  </div>
 )
}
