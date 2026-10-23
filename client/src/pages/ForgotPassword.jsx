import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const OTP_SECONDS = 180;

export default function ForgotPassword() {
  const nav = useNavigate();
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
      setOk('OTP sent to your registered email address');
      setStep(2);
      startTimer();
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Failed to send OTP');
    } finally { setBusy(false); }
  };

  const reset = async (e) => {
    e.preventDefault(); setErr(''); setOk('');
    if (pw !== cpw) { setErr('Passwords do not match'); return; }
    if (sec === 0) { setErr('OTP expired. Please resend OTP.'); return; }
    setBusy(true);
    try {
      await axios.post(API + '/api/auth/reset-password', { email: email, otp: otp, newPassword: pw });
      if (timer.current) clearInterval(timer.current);
      setStep(3);
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Reset failed');
    } finally { setBusy(false); }
  };

  const mm = String(Math.floor(sec / 60)).padStart(2, '0');
  const ss = String(sec % 60).padStart(2, '0');
  const tColor = sec === 0 ? '#f87171' : sec <= 30 ? '#fbbf24' : '#60a5fa';

  if (step === 3) {
    return (
      <div style={st.wrap}>
        <div style={st.card}>
          <div style={{ fontSize: 52, textAlign: 'center' }}>🎉</div>
          <h2 style={{ textAlign: 'center', margin: '10px 0' }}>Password Reset Successful!</h2>
          <p style={st.okBox}>Your password has been changed successfully. Please login with your new password.</p>
          <button style={st.btn} onClick={() => nav('/login')}>Go to Login →</button>
        </div>
      </div>
    );
  }

  return (
    <div style={st.wrap}>
      <div style={st.card}>
        <h2 style={{ textAlign: 'center', marginBottom: 6 }}>🔑 Reset Password</h2>
        <p style={{ textAlign: 'center', color: '#8b949e', fontSize: 13, marginBottom: 20 }}>
          {step === 1 ? 'Enter your registered email' : 'Enter the OTP from your email and set a new password'}
        </p>
        {ok && <div style={st.ok}>{ok}</div>}
        {err && <div style={st.err}>{err}</div>}
        {step === 1 ? (
          <form onSubmit={send}>
            <input style={st.input} type="email" placeholder="Registered Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <button style={st.btn} disabled={busy}>{busy ? 'Sending…' : 'Send Reset OTP'}</button>
          </form>
        ) : (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 14, fontSize: 14 }}>
              <span style={{ color: '#8b949e' }}>OTP valid for </span>
              <b style={{ color: tColor }}>{mm}:{ss}</b>
              {sec === 0 && <div style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>OTP expired — please resend</div>}
            </div>
            <form onSubmit={reset}>
              <input style={st.input} placeholder="6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} required />
              <div style={{ position: 'relative' }}>
                <input style={{ ...st.input, paddingRight: 44 }} type={show ? 'text' : 'password'} placeholder="New Password" value={pw} onChange={(e) => setPw(e.target.value)} required />
                <button type="button" onClick={() => setShow(!show)} style={st.eye}>{show ? '🙈' : '👁️'}</button>
              </div>
              <input style={st.input} type="password" placeholder="Confirm New Password" value={cpw} onChange={(e) => setCpw(e.target.value)} required />
              <button style={st.btn} disabled={busy}>{busy ? 'Please wait…' : 'Reset Password'}</button>
            </form>
            <button type="button" onClick={() => send()} disabled={busy} style={st.linkBtn}>
              {busy ? 'Sending…' : '↻ Resend OTP'}
            </button>
          </div>
        )}
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13 }}>
          <Link to="/login" style={{ color: '#4f8cff', textDecoration: 'none' }}>← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}

const st = {
  wrap: { minHeight: '100vh', background: '#0d1117', color: '#fff', fontFamily: 'system-ui', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 400, background: '#161b22', border: '1px solid #30363d', borderRadius: 16, padding: 28 },
  input: { width: '100%', padding: 12, borderRadius: 8, border: '1px solid #30363d', background: '#0d1117', color: '#fff', marginBottom: 14, boxSizing: 'border-box', fontSize: 15 },
  btn: { width: '100%', padding: 13, borderRadius: 8, border: 'none', background: '#4f8cff', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 15 },
  eye: { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: '4px' },
  err: { color: '#ff7b72', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  ok: { color: '#4ade80', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  okBox: { fontSize: 13, color: '#bfdbfe', background: '#1e3a8a', border: '1px solid #3b82f6', padding: 12, borderRadius: 8, lineHeight: 1.5, textAlign: 'center', marginBottom: 16 },
  linkBtn: { width: '100%', background: 'none', border: 'none', color: '#4f8cff', fontSize: 14, cursor: 'pointer', marginTop: 12, padding: 8 },
};
