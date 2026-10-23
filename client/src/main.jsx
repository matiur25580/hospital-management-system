window.addEventListener('error', function(e){ alert('CRASH MSG: ' + (e.message || 'unknown')); });
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './theme/ThemeContext.jsx';
import './theme/theme.css';
import { LanguageProvider } from './i18n/LanguageContext.jsx';
import { ToastProvider } from './components/Toast.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider><ThemeProvider><ToastProvider><div className="theme-invert"><App /></div></ToastProvider></ThemeProvider></LanguageProvider>
  </StrictMode>,
)
