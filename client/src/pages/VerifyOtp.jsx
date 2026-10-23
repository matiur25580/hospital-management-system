import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function VerifyOtp() {
  const nav = useNavigate();
  const [digits,setDigits] = useState(['','','','','','']);
  const [sec,setSec] = useState(180);
  const [err,setErr] = useState(''); const [busy,setBusy] = useState(false); const [done,setDone] = useState(null);
  const reg = JSON.parse(sessionStorage.getItem('hms_reg') || 'null');
  const refs = useRef([]);

  useEffect(()=>{
    if(done) return;
    if(!reg){ nav('/register'); return; }
    if(sec<=0) return;
    const t = setTimeout(()=>setSec(sec-1),1000);
    return ()=>clearTimeout(t);
  },[sec, done]);

  const otp = digits.join('');

  const onChange = (i,v) => {
    v = v.replace(/\D/g,'').slice(-1);
    const d = [...digits]; d[i] = v; setDigits(d);
    if(v && i<5) refs.current[i+1].focus();
  };
  const onKey = (i,e) => {
    if(e.key==='Backspace' && !digits[i] && i>0) refs.current[i-1].focus();
  };
  const onPaste = (e) => {
    const p = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);
    if(!p) return; e.preventDefault();
    const d = [...digits]; p.split('').forEach((c,i)=>d[i]=c); setDigits(d);
    refs.current[Math.min(p.length,5)].focus();
  };

  const verify = async (e) => {
    e.preventDefault(); setErr('');
    if(otp.length<6){ setErr('Please enter 6-digit OTP'); return; }
    setBusy(true);
    try {
      const r = await axios.post(API + '/api/auth/verify-register', { name: reg.fullName, mobile: reg.contact, email: reg.email, dob: reg.dob, password: reg.password, role: reg.role, otp });
      const info = { uniqueId: r.data.uniqueId, name: reg.fullName, role: reg.role };
      sessionStorage.removeItem('hms_reg');
      setDone(info);
    } catch(e2){ setErr(e2.response?.data?.message || 'OTP verification failed'); }
    finally{ setBusy(false); }
  };

  const resend = async () => {
    setErr('');
    try {
      await axios.post(API + '/api/auth/send-otp', { email: reg.email, purpose: 'register' });
      setSec(180); setDigits(['','','','','','']); refs.current[0] && refs.current[0].focus();
    } catch(e2){ setErr(e2.response?.data?.message || 'Resend failed'); }
  };

  if (done) return (
    <div style={S.wrap}>
      <div style={S.card}>
        <div style={S.okIcon}>🎉</div>
        <h2 style={S.h}>Successfully Registered!</h2>
        <p style={S.sm}>Welcome, <b>{done.name}</b> ({done.role})</p>
        <p style={S.sm}>Your Unique ID</p>
        <div style={S.idBox}>{done.uniqueId}</div>
        <p style={S.note}>ℹ️ Please <b>save this ID</b> for future reference. You will need it to login and for all hospital services.</p>
        <button onClick={()=>nav('/login')} style={S.btn}>Go to Login →</button>
      </div>
    </div>
  );

  const mm = String(Math.floor(sec/60)).padStart(2,'0');
  const ss = String(sec%60).padStart(2,'0');

  return (
    <div style={S.wrap}>
      <form onSubmit={verify} style={S.card}>
        <h2 style={S.h}>🔐 Verify OTP</h2>
        <p style={S.sm}>6-digit OTP sent to <b>{reg?.email}</b></p>
        <div style={S.boxes} onPaste={onPaste}>
          {digits.map((d,i)=>(
            <input key={i} ref={el=>refs.current[i]=el}
              value={d} onChange={e=>onChange(i,e.target.value)}
              onKeyDown={e=>onKey(i,e)}
              inputMode="numeric" maxLength={1} style={S.box} />
          ))}
        </div>
        <p style={S.timer}>⏱ {mm}:{ss}</p>
        {err && <p style={S.err}>{err}</p>}
        <button disabled={busy} style={S.btn}>{busy?'Verifying...':'Verify & Register'}</button>
        <p style={S.sm}>
          {sec>0 ? 'OTP expires soon' : <button type="button" onClick={resend} style={S.link}>Resend OTP</button>}
        </p>
        <p style={S.sm}><Link to="/register">← Back</Link></p>
      </form>
    </div>
  );
}
const S = {
  wrap:{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--hms-bg)',padding:16},
  card:{width:'100%',maxWidth:400,background:'var(--hms-surface)',borderRadius:12,padding:28,color:'var(--hms-text)'},
  h:{textAlign:'center',marginBottom:8},
  boxes:{display:'flex',gap:8,justifyContent:'center',marginTop:16},
  box:{width:44,height:52,textAlign:'center',fontSize:22,fontWeight:'bold',borderRadius:8,border:'1px solid var(--hms-border)',background:'var(--hms-bg)',color:'var(--hms-text)',outline:'none'},
  in:{width:'100%',padding:'12px',borderRadius:8,border:'1px solid var(--hms-border)',background:'var(--hms-bg)',color:'var(--hms-text)',boxSizing:'border-box',marginTop:12},
  timer:{textAlign:'center',fontSize:20,color:'#fbbf24',margin:'12px 0 0'},
  err:{color:'#f87171',fontSize:13,marginTop:10},
  btn:{width:'100%',marginTop:18,padding:12,borderRadius:8,border:'none',background:'#2563eb',color:'var(--hms-text)',fontSize:16,cursor:'pointer'},
  sm:{textAlign:'center',fontSize:13,marginTop:14,color:'#94a3b8'},
  link:{background:'none',border:'none',color:'#60a5fa',cursor:'pointer',fontSize:13},
  okIcon:{fontSize:52,textAlign:'center'},
  idBox:{margin:'10px 0',padding:'14px',textAlign:'center',fontSize:26,fontWeight:'bold',letterSpacing:2,background:'var(--hms-bg)',border:'2px dashed #38bdf8',borderRadius:10,color:'#38bdf8'},
  note:{fontSize:13,marginTop:14,color:'#bfdbfe',background:'#1e3a8a',padding:12,borderRadius:8,lineHeight:1.5,border:'1px solid #3b82f6'},
};
