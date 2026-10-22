import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function VerifyOtp() {
  const nav = useNavigate();
  const [otp,setOtp] = useState('');
  const [sec,setSec] = useState(300);
  const [err,setErr] = useState(''); const [busy,setBusy] = useState(false);
  const reg = JSON.parse(sessionStorage.getItem('hms_reg') || 'null');

  useEffect(()=>{
    if(!reg){ nav('/register'); return; }
    if(sec<=0) return;
    const t = setTimeout(()=>setSec(sec-1),1000);
    return ()=>clearTimeout(t);
  },[sec]);

  const mm = String(Math.floor(sec/60)).padStart(2,'0');
  const ss = String(sec%60).padStart(2,'0');

  const verify = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      await axios.post(API + '/auth/register', {...reg, otp, confirm:undefined});
      sessionStorage.removeItem('hms_reg');
      nav('/login');
    } catch(e2){ setErr(e2.response?.data?.message || 'OTP verification failed'); }
    finally{ setBusy(false); }
  };

  const resend = async () => {
    setErr('');
    try {
      await axios.post(API + '/auth/send-otp', { email: reg.email, purpose: 'register' });
      setSec(300);
    } catch(e2){ setErr(e2.response?.data?.message || 'Resend failed'); }
  };

  return (
    <div style={S.wrap}>
      <form onSubmit={verify} style={S.card}>
        <h2 style={S.h}>🔐 Verify OTP</h2>
        <p style={S.sm}>6-digit OTP sent to <b>{reg?.email}</b></p>
        <input value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
          placeholder="Enter 6-digit OTP" inputMode="numeric" style={{...S.in,textAlign:'center',fontSize:22,letterSpacing:6}} required />
        <p style={S.timer}>⏱ {mm}:{ss}</p>
        {err && <p style={S.err}>{err}</p>}
        <button disabled={busy} style={S.btn}>{busy?'Verifying…':'Verify & Register'}</button>
        <p style={S.sm}>
          {sec>0 ? 'OTP expires soon' : <button type="button" onClick={resend} style={S.link}>Resend OTP</button>}
        </p>
        <p style={S.sm}><Link to="/register">← Back</Link></p>
      </form>
    </div>
  );
}
const S = {
  wrap:{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0f172a',padding:16},
  card:{width:'100%',maxWidth:400,background:'#1e293b',borderRadius:12,padding:28,color:'#e2e8f0'},
  h:{textAlign:'center',marginBottom:8},
  in:{width:'100%',padding:'12px',borderRadius:8,border:'1px solid #334155',background:'#0f172a',color:'#fff',boxSizing:'border-box',marginTop:12},
  timer:{textAlign:'center',fontSize:20,color:'#fbbf24',margin:'12px 0 0'},
  err:{color:'#f87171',fontSize:13,marginTop:10},
  btn:{width:'100%',marginTop:18,padding:12,borderRadius:8,border:'none',background:'#2563eb',color:'#fff',fontSize:16,cursor:'pointer'},
  sm:{textAlign:'center',fontSize:13,marginTop:14,color:'#94a3b8'},
  link:{background:'none',border:'none',color:'#60a5fa',cursor:'pointer',fontSize:13},
};
