import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthHeader from '../components/AuthHeader';
import { useLang } from '../i18n/LanguageContext';
import { useToast } from '../components/Toast';
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Login() {
  const nav = useNavigate();
  const { t } = useLang();
  const toast = useToast();
  const [role, setRole] = useState('Admin');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr(''); setOk('');
    if (!identifier.trim() || !password) {
      const m = t('auth.fill_all');
      setErr(m); toast.error(m); return;
    }
    setBusy(true);
    try {
      const res = await axios.post(API + '/api/auth/login', { email: identifier.trim(), password, role });
      sessionStorage.setItem('hms_token', res.data.token);
      sessionStorage.setItem('hms_user', JSON.stringify(res.data.user));
      const m = t('auth.login_success');
      setOk('✅ ' + m); toast.success(m);
      setTimeout(() => { nav('/dashboard', { replace: true }); }, 1200);
    } catch (e2) {
      const m = e2.response?.data?.message || 'Login failed';
      setErr(m); toast.error(m);
      setBusy(false);
    }
  };

  return (
    <div style={{ ...S.wrap, position: 'relative' }}>
      <AuthHeader />
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} style={S.card}>
        <h2 style={S.h}>🏥 {t('auth.login_title')}</h2>
        <label style={S.lb}>{t('auth.role')}</label>
        <select value={role} onChange={e => setRole(e.target.value)} style={S.in}>
          <option>Admin</option><option>Doctor</option><option>Nurse</option><option>Receptionist</option><option>Patient</option>
        </select>
        <label style={S.lb}>{t('auth.email_id')}</label>
        <input value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder={t('auth.email_id')} style={S.in} required />
        <label style={S.lb}>{t('auth.password')}</label>
        <div style={{ position: 'relative' }}>
          <input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder={t('auth.password')} style={{ ...S.in, paddingRight: 44 }} required />
          <button type="button" onClick={() => setShow(!show)} style={S.eye}>{show ? '🙈' : '👁️'}</button>
        </div>
        {err && <p style={S.err}>{err}</p>}
        {ok && <p style={S.ok}>{ok}</p>}
        <button type="submit" disabled={busy} style={S.btn}>{busy ? '⏳...' : t('auth.login')}</button>
        <p style={S.sm}>{t('auth.new_here')} <Link to="/register">{t('auth.register_first')}</Link></p>
        <div style={{ textAlign: 'right', marginTop: 8 }}>
          <Link to="/forgot-password" style={{ color: '#4f8cff', fontSize: 13, textDecoration: 'none' }}>{t('auth.forgot')}</Link>
        </div>
      </form>
    </div>
  );
}
const S = {
  wrap: { minHeight: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--hms-bg)', padding: 16, boxSizing: 'border-box' },
  card: { width: '100%', maxWidth: 400, background: 'var(--hms-surface)', border: '1px solid var(--hms-border)', borderRadius: 14, padding: 28, color: 'var(--hms-text)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' },
  h: { textAlign: 'center', marginBottom: 20 },
  lb: { fontSize: 13, margin: '12px 0 6px', display: 'block', color: 'var(--hms-muted)' },
  in: { width: '100%', padding: '12px', borderRadius: 8, border: '1px solid var(--hms-border)', background: 'var(--hms-bg)', color: 'var(--hms-text)', fontSize: 15, boxSizing: 'border-box' },
  eye: { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: '4px' },
  err: { color: '#f87171', fontSize: 13, marginTop: 10 },
  ok: { color: '#4ade80', fontSize: 13, marginTop: 10 },
  btn: { width: '100%', marginTop: 18, padding: 12, borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontSize: 16, cursor: 'pointer', fontWeight: 600 },
  sm: { textAlign: 'center', fontSize: 13, marginTop: 14, color: 'var(--hms-muted)' },
};
