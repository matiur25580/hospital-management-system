window.addEventListener('error', function(e){ alert('CRASH MSG: ' + (e.message || 'unknown')); });
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './theme/ThemeContext.jsx';
import './theme/theme.css';
import { LanguageProvider } from './i18n/LanguageContext.jsx';
import LanguageSwitcher from './components/LanguageSwitcher.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider><ThemeProvider><div className="theme-invert"><App /></div></ThemeProvider><LanguageSwitcher /></LanguageProvider>
  </StrictMode>,
)
