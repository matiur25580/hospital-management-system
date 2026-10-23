import { useLang } from '../i18n/LanguageContext.jsx';

export default function LanguageSwitcher() {
  const { lang, setLang } = useLang();
  const langs = [
    { code: 'en', label: 'EN' },
    { code: 'bn', label: 'বাং' },
    { code: 'hi', label: 'हिं' }
  ];
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-800 border border-gray-700 rounded-full p-1 flex gap-1 shadow-lg">
      {langs.map(l => (
        <button key={l.code} onClick={() => setLang(l.code)}
          className={`px-3 py-1 rounded-full text-xs font-bold ${lang === l.code ? 'bg-blue-600 text-white' : 'bg-transparent text-gray-400'}`}>
          {l.label}
        </button>
      ))}
    </div>
  );
}
