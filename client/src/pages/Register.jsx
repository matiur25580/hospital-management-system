import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Register() {
  const nav = useNavigate();
  const [f,setF] = useState({fullName:'',email:'',contact:'',dob:'',role:'',password:'',confirm:''});
  const [showRole,setShowRole] = useState(false);
  const [show,setShow] = useState(false);
  const [err,setErr] = useState(''); const [busy,setBusy] = useState(false);
  const ch = k => e => setF({...f,[k]:e.target.value});

  const submit = async (e) => {
    e.preventDefault(); setErr('');
    if(!f.role){ setErr('Please select account role'); return; }
    if(f.password !== f.confirm){ setErr('Passwords do not match'); return; }
    if(!/^\d{8}$/.test(f.dob)){ setErr('DOB must be DDMMYYYY (8 digits)'); return; }
    setBusy(true);
    try {
      const r = await axios.post(API + '/api/auth/send-otp', { email: f.email, purpose: 'register' });
      sessionStorage.setItem('hms_reg', JSON.stringify({...f, otpSent:r.data.otpSent}));
      nav('/verify-otp');
    } catch(e2){ setErr(e2.response?.data?.message || 'Failed to send OTP'); }
    finally{ setBusy(false); }
  };

  return (
    <div style={S.wrap}>
      <form onSubmit={submit} style={S.card}>
        <h2 style={S.h}>📝 Register</h2>
        <input value={f.fullName} onChange={ch('fullName')} placeholder="Full Name" style={S.in} required />
        <input value={f.email} onChange={ch('email')} placeholder="Email Address" type="email" style={S.in} required />
        <input value={f.contact} onChange={ch('contact')} placeholder="Contact Number" style={S.in} required />
        <input value={f.dob} onChange={ch('dob')} placeholder="Date of Birth (DDMMYYYY)" maxLength={8} inputMode="numeric" style={S.in} required />
        <button type="button" onClick={()=>setShowRole(true)} style={S.in}>
          {f.role || 'Select Account Role ▼'}
        </button>
        <div style={{position:'relative',marginTop:12}}>
          <input type="password" value={f.password} onChange={ch('password')} placeholder="Password" style={{...S.in}} required />
        </div>
        <input type="password" value={f.confirm} onChange={ch('confirm')} placeholder="Confirm Password" style={S.in} required />
        {err && <p style={S.err}>{err}</p>}
        <button disabled={busy} style={S.btn}>{busy?'Sending OTP…':'Send OTP & Continue'}</button>
        <p style={S.sm}>Have account? <Link to="/login">Login</Link></p>
      </form>
      {showRole && (
        <div style={S.modal} onClick={()=>setShowRole(false)}>
          <div style={S.pop} onClick={e=>e.stopPropagation()}>
            <h3 style={{marginTop:0}}>Select Role</h3>
            {['Admin','Doctor','Nurse','Receptionist','Patient'].map(r=>(
              <button key={r} type="button" style={S.ropt}
                onClick={()=>{setF({...f,role:r});setShowRole(false);}}>{r}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
const S = {
  wrap:{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--hms-bg)',padding:16},
  card:{width:'100%',maxWidth:400,background:'var(--hms-surface)',borderRadius:12,padding:28,color:'var(--hms-text)'},
  h:{textAlign:'center',marginBottom:20},
  in:{width:'100%',padding:'12px',borderRadius:8,border:'1px solid var(--hms-border)',background:'var(--hms-bg)',color:'var(--hms-text)',fontSize:15,boxSizing:'border-box',marginTop:12,textAlign:'left',cursor:'pointer'},
  eye:{position:'absolute',right:8,top:20,background:'none',border:'none',fontSize:18,cursor:'pointer'},
  err:{color:'#f87171',fontSize:13,marginTop:10},
  btn:{width:'100%',marginTop:18,padding:12,borderRadius:8,border:'none',background:'#16a34a',color:'var(--hms-text)',fontSize:16,cursor:'pointer'},
  sm:{textAlign:'center',fontSize:13,marginTop:14,color:'#94a3b8'},
  modal:{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',display:'flex',alignItems:'center',justifyContent:'center'},
  pop:{background:'var(--hms-surface)',borderRadius:12,padding:24,width:280,color:'var(--hms-text)'},
  ropt:{display:'block',width:'100%',marginTop:10,padding:12,borderRadius:8,border:'1px solid var(--hms-border)',background:'var(--hms-bg)',color:'var(--hms-text)',fontSize:16,cursor:'pointer'},
};
