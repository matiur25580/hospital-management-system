import { createContext, useContext, useEffect, useState } from 'react';
import translations from '../i18n/translations';

const LangCtx = createContext({ lang: 'en', t: (k) => k, setLang: () => {} });
export const useLang = () => useContext(LangCtx);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('hms-lang') || 'en');
  useEffect(() => { localStorage.setItem('hms-lang', lang); }, [lang]);
  const t = (key) => {
    const keys = key.split('.');
    let v = translations[lang];
    for (const k of keys) { v = v?.[k]; if (v === undefined) break; }
    if (v === undefined) { v = translations.en; for (const k of keys) { v = v?.[k]; if (v === undefined) return key; } }
    return typeof v === 'string' ? v : key;
  };
  return <LangCtx.Provider value={{ lang, t, setLang }}>{children}</LangCtx.Provider>;
}
