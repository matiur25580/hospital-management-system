import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function ForgotPassword() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [pw, setPw] = useState('');
  const [cpw, setCpw] = useState('');
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState('');

  const send = async e => {
    e.preventDefault(); setMsg('');
    try { await api.post('/auth/send-otp', { email, purpose: 'reset' }); setStep(2); }
    catch (err) { setMsg(err.response?.data?.message || 'Failed to send OTP'); }
  };
  const reset = async e => {
    e.preventDefault(); setMsg('');
    if (pw !== cpw) return setMsg('Passwords do not match');
    try { await api.post('/auth/reset-password', { email, otp, newPassword: pw }); nav('/login'); }
    catch (err) { setMsg(err.response?.data?.message || 'Reset failed'); }
  };

  const st = {
    wrap:{minHeight:'100vh',background:'#0d1117',color:'#fff',fontFamily:'system-ui',display:'flex',alignItems:'center',justifyContent:'center',padding:20},
    card:{width:'100%',maxWidth:400,background:'#161b22',border:'1px solid #30363d',borderRadius:16,padding:28},
    input:{width:'100%',padding:12,borderRadius:8,border:'1px solid #30363d',background:'#0d1117',color:'#fff',marginBottom:14,boxSizing:'border-box'},
    btn:{width:'100%',padding:13,borderRadius:8,border:'none',background:'#4f8cff',color:'#fff',fontWeight:700,cursor:'pointer',fontSize:15},
    eye:{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',fontSize:20,cursor:'pointer',padding:'4px'},
    err:{color:'#ff7b72',fontSize:13,marginBottom:12}
  };

  return (
    <div style={st.wrap}>
      <div style={st.card}>
        <h2 style={{textAlign:'center',marginBottom:6}}>🔑 Reset Password</h2>
        <p style={{textAlign:'center',color:'#8b949e',fontSize:13,marginBottom:20}}>
          {step === 1 ? 'Enter your registered email' : 'Enter OTP from your email + new password'}
        </p>
        {msg && <div style={st.err}>{msg}</div>}
        {step === 1 ? (
          <form onSubmit={send}>
            <input style={st.input} type="email" placeholder="Registered Email" value={email} onChange={e=>setEmail(e.target.value)} required />
            <button style={st.btn}>Send Reset OTP</button>
          </form>
        ) : (
          <form onSubmit={reset}>
            <input style={st.input} placeholder="6-digit OTP" value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} required />
            <div style={{position:'relative'}}>
              <input style={{...st.input,paddingRight:44}} type={show?'text':'password'} placeholder="New Password" value={pw} onChange={e=>setPw(e.target.value)} required />
              <button type="button" onClick={()=>setShow(!show)} style={st.eye}>{show?'🙈':'👁️'}</button>
            </div>
            <input style={st.input} type="password" placeholder="Confirm New Password" value={cpw} onChange={e=>setCpw(e.target.value)} required />
            <button style={st.btn}>Reset Password</button>
          </form>
        )}
        <div style={{textAlign:'center',marginTop:16,fontSize:13}}>
          <Link to="/login" style={{color:'#4f8cff',textDecoration:'none'}}>← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
