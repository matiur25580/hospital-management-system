import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthHeader from '../components/AuthHeader';
import { useLang } from '../i18n/LanguageContext';
import { useToast } from '../components/Toast';
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Register() {
  const nav = useNavigate();
  const { t } = useLang();
  const toast = useToast();
  const [f,setF] = useState({fullName:'',email:'',contact:'',dob:'',role:'',password:'',confirm:''});
  const [showRole,setShowRole] = useState(false);
  const [err,setErr] = useState(''); const [busy,setBusy] = useState(false);
  const ch = k => e => setF({...f,[k]:e.target.value});

  const fail = (m) => { setErr(m); toast.error(m); };

  const submit = async (e) => {
    e.preventDefault(); setErr('');
    if(!f.role){ fail(t('auth.role') + ' — please select'); return; }
    if(f.password !== f.confirm){ fail(t('auth.pw_mismatch')); return; }
    if(!/^\d{8}$/.test(f.dob)){ fail(t('auth.dob') + ' — 8 digits'); return; }
    setBusy(true);
    try {
      const r = await axios.post(API + '/api/auth/send-otp', { email: f.email, purpose: 'register' });
      sessionStorage.setItem('hms_reg', JSON.stringify({...f, otpSent:r.data.otpSent}));
      toast.success(t('auth.reg_success'));
      nav('/verify-otp');
    } catch(e2){ fail(e2.response?.data?.message || 'Failed to send OTP'); }
    finally{ setBusy(false); }
  };

  return (
    <div style={{...S.wrap, position:'relative'}}>
      <AuthHeader />
      <form onSubmit={submit} style={S.card}>
        <h2 style={S.h}>📝 {t('auth.reg_title')}</h2>
        <input value={f.fullName} onChange={ch('fullName')} placeholder={t('auth.fullname')} style={S.in} required />
        <input value={f.email} onChange={ch('email')} placeholder="Email Address" type="email" style={S.in} required />
        <input value={f.contact} onChange={ch('contact')} placeholder={t('auth.contact')} style={S.in} required />
        <input value={f.dob} onChange={ch('dob')} placeholder={t('auth.dob')} maxLength={8} inputMode="numeric" style={S.in} required />
        <button type="button" onClick={()=>setShowRole(true)} style={{...S.in, textAlign:'left', cursor:'pointer'}}>
          {f.role || (t('auth.role') + ' ▼')}
        </button>
        <div style={{position:'relative',marginTop:12}}>
          <input type="password" value={f.password} onChange={ch('password')} placeholder={t('auth.password')} style={{...S.in}} required />
        </div>
        <input type="password" value={f.confirm} onChange={ch('confirm')} placeholder={t('auth.confirm_pw')} style={S.in} required />
        {err && <p style={S.err}>{err}</p>}
        <button disabled={busy} style={S.btn}>{busy?'⏳...':t('auth.send_otp') + ' & ' + t('auth.register')}</button>
        <p style={S.sm}>{t('auth.have_account')} <Link to="/login">{t('auth.back_login')}</Link></p>
      </form>
      {showRole && (
        <div style={S.modal} onClick={()=>setShowRole(false)}>
          <div style={S.pop} onClick={e=>e.stopPropagation()}>
            <h3 style={{marginTop:0}}>{t('auth.role')}</h3>
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
  wrap:{minHeight:'100vh',width:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--hms-bg)',padding:16,boxSizing:'border-box'},
  card:{width:'100%',maxWidth:420,background:'var(--hms-surface)',border:'1px solid var(--hms-border)',borderRadius:14,padding:28,color:'var(--hms-text)',boxShadow:'0 8px 32px rgba(0,0,0,0.2)'},
  h:{textAlign:'center',marginBottom:16},
  in:{width:'100%',padding:'12px',borderRadius:8,border:'1px solid var(--hms-border)',background:'var(--hms-bg)',color:'var(--hms-text)',fontSize:15,boxSizing:'border-box',marginTop:12},
  err:{color:'#f87171',fontSize:13,marginTop:10},
  btn:{width:'100%',marginTop:18,padding:12,borderRadius:8,border:'none',background:'#2563eb',color:'#fff',fontSize:16,cursor:'pointer',fontWeight:600},
  sm:{textAlign:'center',fontSize:13,marginTop:14,color:'var(--hms-muted)'},
  modal:{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100},
  pop:{background:'var(--hms-surface)',border:'1px solid var(--hms-border)',borderRadius:12,padding:20,minWidth:260,color:'var(--hms-text)'},
  ropt:{display:'block',width:'100%',padding:12,margin:'6px 0',borderRadius:8,border:'1px solid var(--hms-border)',background:'var(--hms-bg)',color:'var(--hms-text)',cursor:'pointer',fontSize:15},
};
