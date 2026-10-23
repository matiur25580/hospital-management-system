import { useEffect, useState } from 'react';
import api from '../api';
import { useLang } from '../i18n/LanguageContext.jsx';

const CATS = ['medicine', 'consumable', 'surgical', 'equipment'];
const emptyStock = { itemName: '', category: 'medicine', batchNo: '', quantity: '', unit: 'pcs', expiryDate: '', supplier: '', purchasePrice: '', reorderLevel: '', location: 'Store' };
const emptyRow = () => ({ itemName: '', quantity: '', unit: 'pcs', rate: '', batchNo: '', expiryDate: '' });

export default function InventoryMgmt() {
  const { t } = useLang();
  const [tab, setTab] = useState('alerts');
  const [items, setItems] = useState([]);
  const [alerts, setAlerts] = useState({ expiring: [], lowStock: [] });
  const [pos, setPos] = useState([]);
  const [showStock, setShowStock] = useState(false);
  const [showPO, setShowPO] = useState(false);
  const [sf, setSf] = useState(emptyStock);
  const [editId, setEditId] = useState(null);
  const [pf, setPf] = useState({ supplier: '', expectedDate: '', notes: '', rows: [emptyRow()] });
  const [me, setMe] = useState('');

  const load = async () => {
    try {
      const [it, al, p, m] = await Promise.all([
        api.get('/inventory/items'), api.get('/inventory/alerts'),
        api.get('/inventory/purchase-orders'), api.get('/auth/me')
      ]);
      setItems(it.data); setAlerts(al.data); setPos(p.data); setMe(m.data.name || '');
    } catch (e) { console.error(e); }
  };
  useEffect(() => { load(); }, []);

  const seed = async () => {
    try { const { data } = await api.post('/inventory/seed-sample'); alert('Seeded: ' + data.seeded); load(); }
    catch (e) { alert('Failed'); }
  };

  const saveStock = async () => {
    if (!sf.itemName.trim()) { alert(t('inv.item')); return; }
    try {
      const body = { ...sf, quantity: Number(sf.quantity) || 0, purchasePrice: Number(sf.purchasePrice) || 0, reorderLevel: Number(sf.reorderLevel) || 0 };
      if (editId) await api.patch(`/inventory/items/${editId}`, body);
      else await api.post('/inventory/items', body);
      setSf(emptyStock); setEditId(null); setShowStock(false); load();
    } catch (e) { alert('Failed: ' + (e.response?.data?.message || e.message)); }
  };

  const delStock = async (id) => {
    if (!confirm('Delete?')) return;
    try { await api.delete(`/inventory/items/${id}`); load(); } catch (e) { alert('Failed'); }
  };

  const editStock = (it) => {
    setSf({ itemName: it.itemName, category: it.category, batchNo: it.batchNo || '', quantity: it.quantity, unit: it.unit || 'pcs', expiryDate: it.expiryDate || '', supplier: it.supplier || '', purchasePrice: it.purchasePrice || '', reorderLevel: it.reorderLevel || '', location: it.location || 'Store' });
    setEditId(it._id); setShowStock(true);
  };

  const updRow = (i, k, v) => setPf({ ...pf, rows: pf.rows.map((rw, j) => (j === i ? { ...rw, [k]: v } : rw)) });
  const poTotal = pf.rows.reduce((s, rw) => s + (Number(rw.quantity) || 0) * (Number(rw.rate) || 0), 0);

  const createPO = async () => {
    if (!pf.supplier.trim() || !pf.rows.some(rw => rw.itemName.trim() && Number(rw.quantity) > 0)) { alert(t('po.supplier')); return; }
    try {
      await api.post('/inventory/purchase-orders', {
        supplier: pf.supplier, expectedDate: pf.expectedDate, notes: pf.notes, orderedBy: me,
        items: pf.rows.filter(rw => rw.itemName.trim()).map(rw => ({ ...rw, quantity: Number(rw.quantity) || 0, rate: Number(rw.rate) || 0 }))
      });
      setPf({ supplier: '', expectedDate: '', notes: '', rows: [emptyRow()] });
      setShowPO(false); load();
    } catch (e) { alert('Failed'); }
  };

  const poAction = async (id, action) => {
    try {
      if (action === 'receive') await api.patch(`/inventory/purchase-orders/${id}/receive`);
      else await api.patch(`/inventory/purchase-orders/${id}`, { status: action });
      load();
    } catch (e) { alert('Failed'); }
  };

  const poColor = { draft: 'bg-gray-600', sent: 'bg-blue-700', received: 'bg-green-700', cancelled: 'bg-red-700' };

  return (
    <div className="space-y-3">
      <h3 className="font-bold">📦 {t('inv.title')}</h3>
      <div className="flex gap-2">
        {['alerts', 'items', 'po'].map(tb => (
          <button key={tb} onClick={() => setTab(tb)}
            className={`flex-1 py-1 rounded text-sm font-bold relative ${tab === tb ? 'bg-blue-600' : 'bg-gray-700'}`}>
            {tb === 'po' ? t('po.title') : t('inv.' + tb)}
            {tb === 'alerts' && (alerts.expiring.length + alerts.lowStock.length) > 0 && (
              <span className="absolute -top-2 -right-1 text-[10px] bg-red-600 px-2 rounded-full font-bold">{alerts.expiring.length + alerts.lowStock.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'alerts' && (
        <div className="space-y-3">
          <div className="text-xs font-bold text-red-400">⚠️ {t('inv.expiring')} ({alerts.expiring.length})</div>
          {alerts.expiring.map(it => (
            <div key={it._id} className={`bg-gray-800 p-2 rounded-xl text-xs flex justify-between border ${it.daysLeft <= 0 ? 'border-red-600' : it.daysLeft <= 30 ? 'border-red-700' : 'border-yellow-700'}`}>
              <div><span className="font-semibold">{it.itemName}</span> <span className="text-gray-500">({it.batchNo}) • {it.quantity} {it.unit}</span></div>
              <div className={`font-bold ${it.daysLeft <= 0 ? 'text-red-500' : it.daysLeft <= 30 ? 'text-red-400' : 'text-yellow-400'}`}>
                {it.daysLeft <= 0 ? t('inv.expired') : it.daysLeft + ' ' + t('inv.days_left')}
              </div>
            </div>
          ))}
          {alerts.expiring.length === 0 && <p className="text-gray-500 text-xs">✓</p>}
          <div className="text-xs font-bold text-yellow-400">📉 {t('inv.lowstock')} ({alerts.lowStock.length})</div>
          {alerts.lowStock.map(it => (
            <div key={it._id} className="bg-gray-800 p-2 rounded-xl text-xs flex justify-between">
              <span className="font-semibold">{it.itemName}</span>
              <span className="font-bold text-yellow-400">{it.quantity} / {it.reorderLevel} {it.unit}</span>
            </div>
          ))}
          {alerts.lowStock.length === 0 && <p className="text-gray-500 text-xs">✓</p>}
        </div>
      )}

      {tab === 'items' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <button onClick={() => { setShowStock(!showStock); setEditId(null); setSf(emptyStock); }} className="flex-1 bg-teal-600 py-2 rounded-xl text-sm font-bold">{t('inv.add')}</button>
            {items.length === 0 && <button onClick={seed} className="flex-1 bg-purple-600 py-2 rounded-xl text-sm font-bold">{t('inv.seed')}</button>}
          </div>
          {showStock && (
            <div className="bg-gray-800 p-3 rounded-xl space-y-2">
              <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('inv.item') + ' *'} value={sf.itemName} onChange={e => setSf({ ...sf, itemName: e.target.value })} />
              <div className="flex gap-2">
                <select className="flex-1 bg-gray-700 p-2 rounded text-sm" value={sf.category} onChange={e => setSf({ ...sf, category: e.target.value })}>
                  {CATS.map(c => <option key={c} value={c}>{t('inv.cat_' + c)}</option>)}
                </select>
                <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('inv.batch')} value={sf.batchNo} onChange={e => setSf({ ...sf, batchNo: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <input type="number" className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('inv.qty')} value={sf.quantity} onChange={e => setSf({ ...sf, quantity: e.target.value })} />
                <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('inv.unit')} value={sf.unit} onChange={e => setSf({ ...sf, unit: e.target.value })} />
                <input type="date" className="flex-1 bg-gray-700 p-2 rounded text-sm" value={sf.expiryDate} onChange={e => setSf({ ...sf, expiryDate: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('inv.supplier')} value={sf.supplier} onChange={e => setSf({ ...sf, supplier: e.target.value })} />
                <input type="number" className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('inv.price')} value={sf.purchasePrice} onChange={e => setSf({ ...sf, purchasePrice: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <input type="number" className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('inv.reorder')} value={sf.reorderLevel} onChange={e => setSf({ ...sf, reorderLevel: e.target.value })} />
                <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('inv.location')} value={sf.location} onChange={e => setSf({ ...sf, location: e.target.value })} />
              </div>
              <button onClick={saveStock} className="w-full bg-blue-600 py-2 rounded-xl text-sm font-bold">{t('common.save')}</button>
            </div>
          )}
          {items.map(it => (
            <div key={it._id} className="bg-gray-800 p-2 rounded-xl text-xs flex justify-between items-center">
              <div><span className="font-semibold">{it.itemName}</span> <span className="text-gray-500">({it.batchNo})</span>
                <div className="text-gray-500">{it.quantity} {it.unit} • exp: {it.expiryDate || '-'} • {it.location}</div></div>
              <div className="flex gap-1">
                <button onClick={() => editStock(it)} className="bg-gray-700 px-2 py-1 rounded">{t('inv.edit')}</button>
                <button onClick={() => delStock(it._id)} className="bg-red-700 px-2 py-1 rounded">✕</button>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-gray-500 text-xs">{t('inv.no_items')}</p>}
        </div>
      )}

      {tab === 'po' && (
        <div className="space-y-2">
          <button onClick={() => setShowPO(!showPO)} className="w-full bg-teal-600 py-2 rounded-xl text-sm font-bold">{t('po.new')}</button>
          {showPO && (
            <div className="bg-gray-800 p-3 rounded-xl space-y-2">
              <div className="flex gap-2">
                <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('po.supplier') + ' *'} value={pf.supplier} onChange={e => setPf({ ...pf, supplier: e.target.value })} />
                <input type="date" className="flex-1 bg-gray-700 p-2 rounded text-sm" value={pf.expectedDate} onChange={e => setPf({ ...pf, expectedDate: e.target.value })} />
              </div>
              {pf.rows.map((rw, i) => (
                <div key={i} className="flex gap-1">
                  <input className="flex-1 bg-gray-700 p-2 rounded text-sm" style={{ minWidth: 0 }} placeholder={t('inv.item')} value={rw.itemName} onChange={e => updRow(i, 'itemName', e.target.value)} />
                  <input type="number" className="bg-gray-700 p-2 rounded text-sm" style={{ width: 60 }} placeholder={t('inv.qty')} value={rw.quantity} onChange={e => updRow(i, 'quantity', e.target.value)} />
                  <input type="number" className="bg-gray-700 p-2 rounded text-sm" style={{ width: 70 }} placeholder="Rs." value={rw.rate} onChange={e => updRow(i, 'rate', e.target.value)} />
                </div>
              ))}
              <button onClick={() => setPf({ ...pf, rows: [...pf.rows, emptyRow()] })} className="text-xs bg-gray-700 px-3 py-1 rounded">{t('po.add_row')}</button>
              <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('po.notes')} value={pf.notes} onChange={e => setPf({ ...pf, notes: e.target.value })} />
              <div className="flex justify-between font-bold text-sm"><span>{t('po.total')}:</span><span>Rs. {poTotal.toLocaleString()}</span></div>
              <button onClick={createPO} className="w-full bg-blue-600 py-2 rounded-xl text-sm font-bold">{t('common.save')}</button>
            </div>
          )}
          {pos.map(p => (
            <div key={p._id} className="bg-gray-800 p-3 rounded-xl text-xs">
              <div className="flex justify-between items-center">
                <div className="font-semibold text-sm">{p.poNo} <span className="text-gray-500 font-normal">({p.supplier})</span></div>
                <span className={`px-2 py-1 rounded font-bold ${poColor[p.status]}`}>{t('po.status_' + p.status).toUpperCase()}</span>
              </div>
              <div className="text-gray-500 mt-1">{p.items.map(it => `${it.itemName} × ${it.quantity}`).join(', ')}</div>
              <div className="flex justify-between mt-1"><span className="text-gray-500">{t('po.expected')}: {p.expectedDate || '-'}</span><span className="font-bold">Rs. {p.totalAmount.toLocaleString()}</span></div>
              {p.status === 'draft' && <button onClick={() => poAction(p._id, 'sent')} className="mt-2 bg-blue-600 px-3 py-1 rounded font-bold">{t('po.send')}</button>}
              {p.status === 'sent' && (
                <div className="flex gap-2 mt-2">
                  <button onClick={() => poAction(p._id, 'receive')} className="bg-green-600 px-3 py-1 rounded font-bold">{t('po.receive')}</button>
                  <button onClick={() => poAction(p._id, 'cancelled')} className="bg-gray-600 px-3 py-1 rounded">✕</button>
                </div>
              )}
            </div>
          ))}
          {pos.length === 0 && <p className="text-gray-500 text-xs">{t('po.no_po')}</p>}
        </div>
      )}
    </div>
  );
}
