import { createContext, useContext, useState, useCallback } from 'react';

const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);
  const success = useCallback((m) => show(m, 'success'), [show]);
  const error = useCallback((m) => show(m, 'error'), [show]);
  const info = useCallback((m) => show(m, 'info'), [show]);
  return (
    <ToastCtx.Provider value={{ show, success, error, info }}>
      {children}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: '90vw' }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: t.type === 'success' ? '#166534' : t.type === 'error' ? '#991b1b' : '#1e40af',
            color: '#fff', padding: '12px 18px', borderRadius: 10, fontSize: 14,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)', animation: 'toastIn 0.3s ease'
          }}>✓ {t.msg}</div>
        ))}
      </div>
      <style>{`@keyframes toastIn { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: none; } }`}</style>
    </ToastCtx.Provider>
  );
}
