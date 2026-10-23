import { useTheme } from '../theme/ThemeContext';
export default function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="fixed top-4 right-4 z-50 w-11 h-11 rounded-full bg-gray-800 border border-gray-600 text-xl shadow-lg active:scale-95 transition flex items-center justify-center"
      title={dark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {dark ? '☀️' : '🌙'}
    </button>
  );
}
