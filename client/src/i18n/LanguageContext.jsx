import { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './translations';

const LangCtx = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('app-lang') || 'en');
  useEffect(() => { localStorage.setItem('app-lang', lang); }, [lang]);
  const t = (key) => (translations[lang] && translations[lang][key]) || translations.en[key] || key;
  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>;
}

export function useLang() {
  const ctx = useContext(LangCtx);
  if (!ctx) return { lang: 'en', setLang: () => {}, t: (k) => (translations.en[k] || k) };
  return ctx;
}
