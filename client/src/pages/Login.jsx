import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Login() {
  const nav = useNavigate();
  const [role, setRole] = useState('Employee');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const res = await axios.post(API + '/auth/login', { email: identifier, password, role });
      localStorage.setItem('hms_token', res.data.token);
      localStorage.setItem('hms_user', JSON.stringify(res.data.user));
      window.location.href = '/dashboard';
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Login failed');
    } finally { setBusy(false); }
  };

  return (
    <div style={S.wrap}>
      <form onSubmit={submit} style={S.card}>
        <h2 style={S.h}>🏥 Hospital Login</h2>
        <label style={S.lb}>Account Role</label>
        <select value={role} onChange={e=>setRole(e.target.value)} style={S.in}>
          <option>Admin</option><option>Doctor</option><option>Nurse</option><option>Receptionist</option><option>Patient</option>
        </select>
        <label style={S.lb}>Email or Unique ID</label>
        <input value={identifier} onChange={e=>setIdentifier(e.target.value)} placeholder="Email or Unique ID" style={S.in} required />
        <label style={S.lb}>Password</label>
        <div style={{position:'relative'}}>
          <input type={show?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" style={{...S.in,paddingRight:44}} required />
          <button type="button" onClick={()=>setShow(!show)} style={S.eye}>{show?'🙈':'👁️'}</button>
        </div>
        {err && <p style={S.err}>{err}</p>}
        <button disabled={busy} style={S.btn}>{busy?'Please wait…':'Login'}</button>
        <p style={S.sm}>New here? <Link to="/register">Register first</Link></p>
      </form>
    </div>
  );
}
const S = {
  wrap:{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0f172a',padding:16},
  card:{width:'100%',maxWidth:400,background:'#1e293b',borderRadius:12,padding:28,color:'#e2e8f0'},
  h:{textAlign:'center',marginBottom:20},
  lb:{fontSize:13,margin:'12px 0 6px',display:'block',color:'#94a3b8'},
  in:{width:'100%',padding:'12px',borderRadius:8,border:'1px solid #334155',background:'#0f172a',color:'#fff',fontSize:15,boxSizing:'border-box'},
  eye:{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#fff',padding:'4px'},
  err:{color:'#f87171',fontSize:13,marginTop:10},
  btn:{width:'100%',marginTop:18,padding:12,borderRadius:8,border:'none',background:'#2563eb',color:'#fff',fontSize:16,cursor:'pointer'},
  sm:{textAlign:'center',fontSize:13,marginTop:14,color:'#94a3b8'},
};
