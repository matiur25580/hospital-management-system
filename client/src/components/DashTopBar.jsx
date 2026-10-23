import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../i18n/LanguageContext';
import ThemeSwitcher from './ThemeSwitcher';
import LanguageSwitcher from './LanguageSwitcher';

export default function DashTopBar() {
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useLang();
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
      <div style={{ fontSize: 14, color: 'var(--hms-muted)' }}>
        👤 <b style={{ color: 'var(--hms-text)' }}>{user?.name}</b> · {user?.role} · 🆔 {user?.uniqueId}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <LanguageSwitcher />
        <ThemeSwitcher />
        <button
          onClick={() => { logout(); nav('/login'); }}
          style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--hms-border)', background: 'var(--hms-surface)', color: 'var(--hms-text)', cursor: 'pointer', fontSize: 13 }}
        >
          🚪 {t('common.logout')}
        </button>
      </div>
    </div>
  );
}
