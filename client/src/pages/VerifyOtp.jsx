import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import AuthHeader from '../components/AuthHeader';
import { useLang } from '../i18n/LanguageContext';
import { useToast } from '../components/Toast';
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function VerifyOtp() {
  const nav = useNavigate();
  const { t } = useLang();
  const toast = useToast();
  const [digits,setDigits] = useState(['','','','','','']);
  const [sec,setSec] = useState(180);
  const [err,setErr] = useState(''); const [busy,setBusy] = useState(false); const [done,setDone] = useState(null);
  const reg = JSON.parse(sessionStorage.getItem('hms_reg') || 'null');
  const refs = useRef([]);

  useEffect(()=>{
    if(done) return;
    if(!reg){ nav('/register'); return; }
    if(sec<=0) return;
    const tm = setTimeout(()=>setSec(sec-1),1000);
    return ()=>clearTimeout(tm);
  },[sec, done]);

  const otp = digits.join('');
  const fail = (m) => { setErr(m); toast.error(m); };

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
    if(otp.length<6){ fail('Please enter 6-digit OTP'); return; }
    setBusy(true);
    try {
      const r = await axios.post(API + '/api/auth/verify-register', { name: reg.fullName, mobile: reg.contact, email: reg.email, dob: reg.dob, password: reg.password, role: 'Patient', otp });
      const info = { uniqueId: r.data.uniqueId, name: reg.fullName, role: 'Patient' };
      sessionStorage.removeItem('hms_reg');
      toast.success(t('auth.reg_success'));
      setDone(info);
    } catch(e2){ fail(e2.response?.data?.message || 'OTP verification failed'); }
    finally{ setBusy(false); }
  };

  const mm = String(Math.floor(sec / 60)).padStart(2, '0');
  const ss = String(sec % 60).padStart(2, '0');
  const tColor = sec === 0 ? '#f87171' : sec <= 30 ? '#fbbf24' : '#60a5fa';

  if (done) {
    return (
      <div style={{...V.wrap, position:'relative'}}>
        <AuthHeader />
        <div style={V.card}>
          <div style={{fontSize:52,textAlign:'center'}}>🎉</div>
          <h2 style={{textAlign:'center'}}>Registration Complete!</h2>
          <p style={V.okBox}>Your Unique ID: <b>{done.uniqueId}</b></p>
          <button style={V.btn} onClick={()=>nav('/login')}>{t('auth.back_login')} →</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{...V.wrap, position:'relative'}}>
      <AuthHeader />
      <form onSubmit={verify} style={V.card}>
        <h2 style={{textAlign:'center',marginBottom:6}}>🔐 {t('auth.verify')} OTP</h2>
        <p style={{textAlign:'center',color:'var(--hms-muted)',fontSize:13,marginBottom:14}}>
          OTP sent to <b>{reg?.email}</b>
        </p>
        <div style={{textAlign:'center',marginBottom:14,fontSize:16}}>
          <b style={{color:tColor,fontVariantNumeric:'tabular-nums'}}>⏱️ {mm}:{ss}</b>
          {sec===0 && <div style={{color:'#f87171',fontSize:12,marginTop:4}}>OTP expired — please resend</div>}
        </div>
        <div onPaste={onPaste} style={V.row}>
          {digits.map((d,i)=>(
            <input key={i} ref={el=>refs.current[i]=el} value={d} onChange={e=>onChange(i,e.target.value)} onKeyDown={e=>onKey(i,e)} style={V.box} inputMode="numeric" maxLength={1} required />
          ))}
        </div>
        {err && <p style={V.err}>{err}</p>}
        <button disabled={busy} style={V.btn}>{busy?'⏳...':t('auth.verify')}</button>
        <button type="button" disabled={busy} onClick={async()=>{
          try {
            await axios.post(API + '/api/auth/send-otp', { email: reg.email, purpose: 'register' });
            setDigits(['','','','','','']); setSec(180);
            toast.success('New OTP sent');
          } catch(e2){ fail(e2.response?.data?.message || 'Failed to resend OTP'); }
        }} style={V.linkBtn}>↻ {t('auth.send_otp')}</button>
        <p style={{textAlign:'center',fontSize:13,marginTop:12}}><Link to="/register" style={{color:'#4f8cff',textDecoration:'none'}}>← {t('auth.back_login')}</Link></p>
      </form>
    </div>
  );
}
const V = {
  wrap:{minHeight:'100vh',width:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--hms-bg)',padding:16,boxSizing:'border-box'},
  card:{width:'100%',maxWidth:420,background:'var(--hms-surface)',border:'1px solid var(--hms-border)',borderRadius:14,padding:28,color:'var(--hms-text)',boxShadow:'0 8px 32px rgba(0,0,0,0.2)'},
  row:{display:'flex',gap:8,justifyContent:'center',marginBottom:16},
  box:{width:46,height:52,textAlign:'center',fontSize:22,borderRadius:8,border:'1px solid var(--hms-border)',background:'var(--hms-bg)',color:'var(--hms-text)'},
  err:{color:'#f87171',fontSize:13,textAlign:'center',marginBottom:10},
  okBox:{fontSize:15,color:'var(--hms-text)',background:'var(--hms-bg)',border:'1px solid var(--hms-border)',padding:14,borderRadius:8,textAlign:'center',marginBottom:16},
  btn:{width:'100%',marginTop:8,padding:12,borderRadius:8,border:'none',background:'#2563eb',color:'#fff',fontSize:16,cursor:'pointer',fontWeight:600},
  linkBtn:{width:'100%',padding:10,marginTop:10,borderRadius:8,border:'1px solid var(--hms-border)',background:'transparent',color:'var(--hms-text)',cursor:'pointer',fontSize:14},
};
