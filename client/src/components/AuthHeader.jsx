import { useTheme } from '../theme/ThemeContext';
import { useLang } from '../i18n/LanguageContext';
import { useClock } from '../hooks/useClock';

export default function AuthHeader() {
  const { dark, toggle } = useTheme();
  const { lang, setLang } = useLang();
  const { date, time } = useClock();
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 20px', flexWrap: 'wrap', gap: 8, zIndex: 10
    }}>
      <div style={{ fontSize: 13, color: 'var(--hms-muted)', lineHeight: 1.5 }}>
        <span>📅 {date}</span>
        <span style={{ marginLeft: 12, fontWeight: 700, color: 'var(--hms-text)', fontVariantNumeric: 'tabular-nums' }}>🕐 {time}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <select value={lang} onChange={e => setLang(e.target.value)}
          style={{ background: 'var(--hms-surface)', color: 'var(--hms-text)', border: '1px solid var(--hms-border)', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', fontSize: 13 }}>
          <option value="en">English</option>
          <option value="hi">हिन्दी</option>
          <option value="bn">বাংলা</option>
        </select>
        <button onClick={toggle} title={dark ? 'Light mode' : 'Dark mode'}
          style={{ background: 'var(--hms-surface)', border: '1px solid var(--hms-border)', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 15 }}>
          {dark ? '☀️' : '🌙'}
        </button>
      </div>
    </div>
  );
}
