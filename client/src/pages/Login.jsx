import { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export default function Login(){
  const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  const [err,setErr]=useState(''); const nav=useNavigate();
  const submit=async(e)=>{
    e.preventDefault(); setErr('');
    try{
      const {data}=await api.post('/auth/login',{email,password});
      sessionStorage.setItem('token',data.token);
      sessionStorage.setItem('user',JSON.stringify(data.user));
      nav('/dashboard');
    }catch(e){ setErr(e.response?.data?.message||'Login failed'); }
  };
  return (
  <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0f172a',color:'#fff'}}>
    <form onSubmit={submit} style={{background:'#1e293b',padding:32,borderRadius:12,width:'100%',maxWidth:380}}>
      <h2 style={{marginBottom:8}}>🏥 Hospital Management</h2>
      <p style={{color:'#94a3b8',marginBottom:20}}>Enterprise Patient Care System</p>
      {err && <div style={{background:'#7f1d1d',padding:8,borderRadius:6,marginBottom:12}}>{err}</div>}
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={{width:'100%',padding:10,marginBottom:10,borderRadius:6,border:'none'}}/>
      <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} style={{width:'100%',padding:10,marginBottom:14,borderRadius:6,border:'none'}}/>
      <button style={{width:'100%',padding:10,borderRadius:6,border:'none',background:'#2563eb',color:'#fff',fontWeight:'bold'}}>Login</button>
    </form>
  </div>);
}
