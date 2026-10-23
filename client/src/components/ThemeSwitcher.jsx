import { useTheme } from '../context/ThemeContext';

export default function ThemeSwitcher() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        padding: '6px 12px', borderRadius: 8,
        border: '1px solid var(--hms-border)',
        background: 'var(--hms-surface)', color: 'var(--hms-text)',
        cursor: 'pointer', fontSize: 14,
      }}
    >
      {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
    </button>
  );
}
