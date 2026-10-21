import { useEffect, useState } from 'react';
import api from '../api';

export default function Dashboard(){
  const user = JSON.parse(localStorage.getItem('user')||'{}');
  const [stats,setStats]=useState({patients:0,doctors:0,appointments:0});
  useEffect(()=>{
    api.get('/dashboard/stats').then(r=>setStats(r.data)).catch(()=>{});
  },[]);
  return (
  <div style={{minHeight:'100vh',background:'#f1f5f9',padding:24}}>
    <div style={{marginBottom:16}}>
        <h1 style={{color:"#1e293b",margin:0}}>Welcome, {user.name}</h1>
        <span style={{background:"#dbeafe",color:"#1d4ed8",padding:"4px 12px",borderRadius:12,fontSize:13,fontWeight:600}}>{user.role}</span>
      </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16,marginTop:20}}>
      <div style={{background:'#fff',padding:20,borderRadius:10}}><h3 style={{color:"#64748b",margin:0,fontSize:14}}>Total Patients</h3><h2 style={{color:"#0f172a",margin:"8px 0 0",fontSize:36}}>{stats.patients}</h2></div>
      <div style={{background:'#fff',padding:20,borderRadius:10}}><h3 style={{color:"#64748b",margin:0,fontSize:14}}>Total Doctors</h3><h2 style={{color:"#0f172a",margin:"8px 0 0",fontSize:36}}>{stats.doctors}</h2></div>
      <div style={{display:'flex',gap:12,marginTop:20,flexWrap:'wrap'}}>
        {user.role==='admin' && <>
          <Link to="/patients" style={lnk('#2563eb')}>Patients</Link>
          <Link to="/appointments" style={lnk('#16a34a')}>Appointments</Link>
          <Link to="/beds" style={lnk('#7c3aed')}>Beds</Link>
        </>}
        {user.role==='doctor' && <>
          <Link to="/appointments" style={lnk('#16a34a')}>My Appointments</Link>
          <Link to="/patients" style={lnk('#2563eb')}>Patients</Link>
        </>}
        {user.role==='receptionist' && <>
          <Link to="/patients" style={lnk('#2563eb')}>Patients</Link>
          <Link to="/appointments" style={lnk('#16a34a')}>Appointments</Link>
          <Link to="/beds" style={lnk('#7c3aed')}>Beds</Link>
        </>}
      </div>
    </div>
    <button onClick={()=>{localStorage.clear();location.href='/';}} style={{marginTop:20,padding:'8px 16px'}}>Logout</button>
  </div>);
}
