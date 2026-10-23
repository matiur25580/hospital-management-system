import { useEffect, useState } from 'react';
import api from '../api';
import { useLang } from '../i18n/LanguageContext.jsx';

const CATS = ['general', 'emergency', 'event', 'holiday'];

export default function NoticeBoard({ mode }) {
  const { t } = useLang();
  const [list, setList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState({ title: '', message: '', category: 'general', priority: 'normal', validUntil: '' });
  const [me, setMe] = useState('');

  const load = async () => {
    try {
      const [n, m] = await Promise.all([api.get('/notices' + (mode === 'admin' ? '?all=1' : '')), api.get('/auth/me')]);
      const sorted = n.data.sort((a, b) => (b.priority === 'high') - (a.priority === 'high'));
      setList(sorted); setMe(m.data.name || '');
    } catch (e) { console.error(e); }
  };
  useEffect(() => { load(); }, []);

  const post = async () => {
    if (!f.title.trim() || !f.message.trim()) { alert(t('nt.heading')); return; }
    try {
      await api.post('/notices', { ...f, postedBy: me });
      setF({ title: '', message: '', category: 'general', priority: 'normal', validUntil: '' });
      setShowForm(false); load();
    } catch (e) { alert('Failed'); }
  };

  const remove = async (id) => {
    if (!confirm(t('nt.remove') + '?')) return;
    try { await api.delete(`/notices/${id}`); load(); } catch (e) { alert('Failed'); }
  };

  const catColor = { general: 'bg-blue-700', emergency: 'bg-red-700', event: 'bg-purple-700', holiday: 'bg-green-700' };

  return (
    <div className="space-y-3">
      <h3 className="font-bold">📢 {t('nt.title')} ({list.length})</h3>
      {mode === 'admin' && (
        <button onClick={() => setShowForm(!showForm)} className="w-full bg-teal-600 py-2 rounded-xl text-sm font-bold">{t('nt.post')}</button>
      )}
      {showForm && mode === 'admin' && (
        <div className="bg-gray-800 p-3 rounded-xl space-y-2">
          <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('nt.heading') + ' *'} value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />
          <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('nt.message') + ' *'} value={f.message} onChange={e => setF({ ...f, message: e.target.value })} />
          <div className="flex gap-2">
            <select className="flex-1 bg-gray-700 p-2 rounded text-sm" value={f.category} onChange={e => setF({ ...f, category: e.target.value })}>
              {CATS.map(c => <option key={c} value={c}>{t('nt.cat_' + c) || c}</option>)}
            </select>
            <select className="flex-1 bg-gray-700 p-2 rounded text-sm" value={f.priority} onChange={e => setF({ ...f, priority: e.target.value })}>
              <option value="normal">{t('common.normal') || 'Normal'}</option>
              <option value="high">🔴 {t('nt.high')}</option>
            </select>
            <input type="date" className="flex-1 bg-gray-700 p-2 rounded text-sm" value={f.validUntil} onChange={e => setF({ ...f, validUntil: e.target.value })} />
          </div>
          <button onClick={post} className="w-full bg-blue-600 py-2 rounded-xl text-sm font-bold">{t('common.save')}</button>
        </div>
      )}
      <div className="space-y-2">
        {list.map(n => (
          <div key={n._id} className={`bg-gray-800 p-3 rounded-xl text-xs ${n.priority === 'high' ? 'border border-red-600' : ''}`}>
            <div className="flex justify-between items-center">
              <div className="font-semibold text-sm">{n.priority === 'high' ? '🔴 ' : ''}{n.title}</div>
              <span className={`px-2 py-1 rounded font-bold ${catColor[n.category]}`}>{t('nt.cat_' + n.category) || n.category}</span>
            </div>
            <div className="text-gray-400 mt-1">{n.message}</div>
            <div className="text-gray-600 mt-1">{n.postedBy} • {new Date(n.createdAt).toLocaleDateString()}{n.validUntil ? ` • ${t('nt.valid')}: ${n.validUntil}` : ''}</div>
            {mode === 'admin' && <button onClick={() => remove(n._id)} className="mt-1 text-red-400 text-xs">{t('nt.remove')}</button>}
          </div>
        ))}
        {list.length === 0 && <p className="text-gray-500 text-xs">{t('nt.no_notices')}</p>}
      </div>
    </div>
  );
}
