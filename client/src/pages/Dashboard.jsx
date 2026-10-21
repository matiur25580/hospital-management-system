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
    <h1 style={{color:"#1e293b"}}>Welcome, {user.name} ({user.role})</h1>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16,marginTop:20}}>
      <div style={{background:'#fff',padding:20,borderRadius:10}}><h3 style={{color:"#64748b",margin:0,fontSize:14}}>Total Patients</h3><h2 style={{color:"#0f172a",margin:"8px 0 0",fontSize:36}}>{stats.patients}</h2></div>
      <div style={{background:'#fff',padding:20,borderRadius:10}}><h3 style={{color:"#64748b",margin:0,fontSize:14}}>Total Doctors</h3><h2 style={{color:"#0f172a",margin:"8px 0 0",fontSize:36}}>{stats.doctors}</h2></div>
      <div style={{background:'#fff',padding:20,borderRadius:10}}><h3 style={{color:"#64748b",margin:0,fontSize:14}}>Appointments</h3><h2 style={{color:"#0f172a",margin:"8px 0 0",fontSize:36}}>{stats.appointments}</h2></div>
    </div>
    <button onClick={()=>{localStorage.clear();location.href='/';}} style={{marginTop:20,padding:'8px 16px'}}>Logout</button>
  </div>);
}
