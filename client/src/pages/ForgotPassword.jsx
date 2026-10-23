import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import AuthHeader from '../components/AuthHeader';
import { useLang } from '../i18n/LanguageContext';
import { useToast } from '../components/Toast';
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const OTP_SECONDS = 180;

export default function ForgotPassword() {
  const nav = useNavigate();
  const { t } = useLang();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [pw, setPw] = useState('');
  const [cpw, setCpw] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const [sec, setSec] = useState(OTP_SECONDS);
  const timer = useRef(null);

  const fail = (m) => { setErr(m); toast.error(m); };
  const good = (m) => { setOk(m); toast.success(m); };

  const startTimer = () => {
    if (timer.current) clearInterval(timer.current);
    setSec(OTP_SECONDS);
    timer.current = setInterval(() => {
      setSec((s) => {
        if (s <= 1) { clearInterval(timer.current); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const send = async (e) => {
    if (e) e.preventDefault();
    setErr(''); setOk(''); setBusy(true);
    try {
      await axios.post(API + '/api/auth/send-otp', { email: email, purpose: 'reset' });
      setOtp('');
      good('OTP sent to your registered email address');
      setStep(2);
      startTimer();
    } catch (e2) {
      fail(e2.response?.data?.message || 'Failed to send OTP');
    } finally { setBusy(false); }
  };

  const reset = async (e) => {
    e.preventDefault(); setErr(''); setOk('');
    if (pw !== cpw) { fail(t('auth.pw_mismatch')); return; }
    if (sec === 0) { fail('OTP expired. Please resend OTP.'); return; }
    setBusy(true);
    try {
      await axios.post(API + '/api/auth/reset-password', { email: email, otp: otp, newPassword: pw });
      if (timer.current) clearInterval(timer.current);
      good(t('auth.reset_success'));
      setStep(3);
    } catch (e2) {
      fail(e2.response?.data?.message || 'Reset failed');
    } finally { setBusy(false); }
  };

  const mm = String(Math.floor(sec / 60)).padStart(2, '0');
  const ss = String(sec % 60).padStart(2, '0');
  const tColor = sec === 0 ? '#f87171' : sec <= 30 ? '#fbbf24' : '#60a5fa';

  if (step === 3) {
    return (
      <div style={{ ...st.wrap, position: 'relative' }}>
        <AuthHeader />
        <div style={st.card}>
          <div style={{ fontSize: 52, textAlign: 'center' }}>🎉</div>
          <h2 style={{ textAlign: 'center', margin: '10px 0' }}>{t('auth.reset_success')}</h2>
          <button style={st.btn} onClick={() => nav('/login')}>{t('auth.back_login')} →</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...st.wrap, position: 'relative' }}>
      <AuthHeader />
      <div style={st.card}>
        <h2 style={{ textAlign: 'center', marginBottom: 6 }}>🔑 {t('auth.fp_title')}</h2>
        <p style={{ textAlign: 'center', color: 'var(--hms-muted)', fontSize: 13, marginBottom: 20 }}>
          {step === 1 ? t('auth.email_id') : t('auth.otp')}
        </p>
        {ok && <div style={st.ok}>{ok}</div>}
        {err && <div style={st.err}>{err}</div>}
        {step === 1 ? (
          <form onSubmit={send}>
            <input style={st.input} type="email" placeholder={t('auth.email_id')} value={email} onChange={(e) => setEmail(e.target.value)} required />
            <button style={st.btn} disabled={busy}>{busy ? '⏳...' : t('auth.send_otp')}</button>
          </form>
        ) : (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 14, fontSize: 14 }}>
              <b style={{ color: tColor, fontVariantNumeric: 'tabular-nums' }}>⏱️ {mm}:{ss}</b>
              {sec === 0 && <div style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>OTP expired — please resend</div>}
            </div>
            <form onSubmit={reset}>
              <input style={st.input} placeholder={t('auth.otp')} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} required />
              <div style={{ position: 'relative' }}>
                <input style={{ ...st.input, paddingRight: 44 }} type={show ? 'text' : 'password'} placeholder={t('auth.new_pw')} value={pw} onChange={(e) => setPw(e.target.value)} required />
                <button type="button" onClick={() => setShow(!show)} style={st.eye}>{show ? '🙈' : '👁️'}</button>
              </div>
              <input style={st.input} type="password" placeholder={t('auth.confirm_pw')} value={cpw} onChange={(e) => setCpw(e.target.value)} required />
              <button style={st.btn} disabled={busy}>{busy ? '⏳...' : t('auth.fp_title')}</button>
            </form>
            <button type="button" onClick={() => send()} disabled={busy} style={st.linkBtn}>
              {busy ? '⏳...' : '↻ ' + t('auth.send_otp')}
            </button>
          </div>
        )}
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13 }}>
          <Link to="/login" style={{ color: '#4f8cff', textDecoration: 'none' }}>← {t('auth.back_login')}</Link>
        </div>
      </div>
    </div>
  );
}

const st = {
  wrap: { minHeight: '100vh', width: '100%', background: 'var(--hms-bg)', color: 'var(--hms-text)', fontFamily: 'system-ui', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, boxSizing: 'border-box' },
  card: { width: '100%', maxWidth: 400, background: 'var(--hms-surface)', border: '1px solid var(--hms-border)', borderRadius: 16, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' },
  input: { width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--hms-border)', background: 'var(--hms-bg)', color: 'var(--hms-text)', marginBottom: 14, boxSizing: 'border-box', fontSize: 15 },
  btn: { width: '100%', padding: 13, borderRadius: 8, border: 'none', background: '#4f8cff', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 15 },
  linkBtn: { width: '100%', padding: 10, marginTop: 10, borderRadius: 8, border: '1px solid var(--hms-border)', background: 'transparent', color: 'var(--hms-text)', cursor: 'pointer', fontSize: 14 },
  eye: { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: '4px' },
  err: { color: '#f87171', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  ok: { color: '#4ade80', fontSize: 13, marginBottom: 12, textAlign: 'center' },
};
