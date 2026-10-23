import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { useLang } from '../../i18n/LanguageContext';
import { useClock } from '../../hooks/useClock';
import { useToast } from '../../components/Toast';

export function DashHeader({ title, icon = '🏥' }) {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const { lang, setLang, t } = useLang();
  const { date, time } = useClock();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    try { toast?.success(t('auth.logged_out') || 'Logged out successfully'); } catch {}
    navigate('/login', { replace: true });
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: 20, flexWrap: 'wrap', gap: 12,
      background: 'var(--hms-surface)', border: '1px solid var(--hms-border)',
      borderRadius: 14, padding: '14px 18px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 32 }}>{icon}</span>
        <div>
          <h2 style={{ margin: 0, fontSize: 20 }}>{title}</h2>
          <p style={{ color: 'var(--hms-muted)', margin: '2px 0 0', fontSize: 13 }}>
            {t('dash.welcome') || 'Welcome'}, <b>{user?.name || 'User'}</b> ({user?.role || ''})
            {user?.uniqueId ? ` · ID: ${user.uniqueId}` : ''}
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{
          fontSize: 13, color: 'var(--hms-muted)', textAlign: 'right', lineHeight: 1.5,
          background: 'var(--hms-bg)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--hms-border)'
        }}>
          <div>📅 {date}</div>
          <div style={{ fontWeight: 700, color: 'var(--hms-text)', fontVariantNumeric: 'tabular-nums' }}>🕐 {time}</div>
        </div>
        <select value={lang} onChange={e => setLang(e.target.value)}
          style={{ background: 'var(--hms-bg)', color: 'var(--hms-text)', border: '1px solid var(--hms-border)', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', fontSize: 13 }}>
          <option value="en">English</option>
          <option value="hi">हिन्दी</option>
          <option value="bn">বাংলা</option>
        </select>
        <button onClick={toggle} title={dark ? 'Light mode' : 'Dark mode'}
          style={{ background: 'var(--hms-bg)', border: '1px solid var(--hms-border)', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 16 }}>
          {dark ? '☀️' : '🌙'}
        </button>
        <button onClick={handleLogout}
          style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
          ⎋ {t('dash.logout') || 'Logout'}
        </button>
      </div>
    </div>
  );
}

export function DashShell({ title, icon, color, stats, actions }) {
  const { t } = useLang();
  return (
    <div style={{ minHeight: '100vh', width: '100%', background: 'var(--hms-bg)', color: 'var(--hms-text)', fontFamily: 'system-ui', padding: 'clamp(12px, 3vw, 28px)', boxSizing: 'border-box' }}>
      <DashHeader title={title} icon={icon} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 24 }}>
        {stats.map(([label, val]) => (
          <div key={label} style={{ background: 'var(--hms-surface)', border: `1px solid ${color}66`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 26, fontWeight: 700, color }}>{val}</div>
            <div style={{ color: 'var(--hms-muted)', fontSize: 13, marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>
      <h3 style={{ marginBottom: 12 }}>{t('dash.quick_actions') || 'Quick Actions'}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14 }}>
        {actions.map(a => (
          <button key={typeof a === 'string' ? a : a.label}
            onClick={typeof a === 'string' ? undefined : a.onClick}
            style={{ background: 'var(--hms-surface)', border: '1px solid var(--hms-border)', color: 'var(--hms-text)', borderRadius: 12, padding: 20, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
            {typeof a === 'string' ? a : a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export const btnPrimary = {
  background: '#2563eb', color: '#fff', border: 'none',
  borderRadius: 8, padding: '10px 18px', cursor: 'pointer', fontWeight: 600, fontSize: 14
};
export const btnDanger = {
  background: '#dc2626', color: '#fff', border: 'none',
  borderRadius: 8, padding: '10px 18px', cursor: 'pointer', fontWeight: 600, fontSize: 14
};
export const btnGhost = {
  background: 'var(--hms-surface)', color: 'var(--hms-text)',
  border: '1px solid var(--hms-border)', borderRadius: 8,
  padding: '10px 18px', cursor: 'pointer', fontWeight: 500, fontSize: 14
};
export const inputStyle = {
  width: '100%', boxSizing: 'border-box', background: 'var(--hms-bg)',
  color: 'var(--hms-text)', border: '1px solid var(--hms-border)',
  borderRadius: 8, padding: '10px 12px', fontSize: 14
};
export const cardStyle = {
  background: 'var(--hms-surface)', border: '1px solid var(--hms-border)',
  borderRadius: 12, padding: 18
};
