import { createContext, useContext, useEffect, useState } from 'react';
const ThemeCtx = createContext({ dark: true, toggle: () => {} });
export const useTheme = () => useContext(ThemeCtx);
export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => { try { const v = localStorage.getItem('hms-theme'); return v ? v === 'dark' : true; } catch { return true; } });
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    try { localStorage.setItem('hms-theme', dark ? 'dark' : 'light'); } catch {}
  }, [dark]);
  return <ThemeCtx.Provider value={{ dark, toggle: () => setDark(d => !d) }}>{children}</ThemeCtx.Provider>;
}
