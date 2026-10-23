import { useEffect, useState } from 'react';
import api from '../api';
import { useLang } from '../i18n/LanguageContext.jsx';
const ZONES = ['main-gate','opd','ipd','ot','lab','pharmacy','emergency','billing'];
const ROLES = ['patient','attendant','doctor','nurse','receptionist','staff','other'];
export default function PPECompliance({ mode = 'view' }) {
  const { t } = useLang();
  const [checks, setChecks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [form, setForm] = useState({ personName: '', personRole: 'patient', zone: 'main-gate', maskWorn: true, glovesWorn: true, maskProvided: false, remarks: '' });
  const load = async () => {
    try {
      const c = await api.get('/ppe?date=' + date);
      const s = await api.get('/ppe/summary?date=' + date);
      setChecks(c.data || []); setSummary(s.data || null);
    } catch (e) { console.error(e); }
  };
  useEffect(() => { load(); }, [date]);
  const submit = async e => {
    e.preventDefault();
    if (!form.personName.trim()) return alert(t('ppe.name'));
    await api.post('/ppe', form);
    setForm(f => ({ ...f, personName: '', remarks: '', maskProvided: false, maskWorn: true, glovesWorn: true }));
    load();
  };
  const zk = z => t('ppe.zone_' + z.replace('-', '_'));
  const rk = r => t('ppe.role_' + r);
  return (
    <div style={{ border: '1px solid var(--hms-border)', borderRadius: 10, padding: 14, margin: '12px 0', background: 'var(--hms-surface)' }}>
      <h3>😷🧤 {t('ppe.title')}</h3>
      <div style={{ background: '#e8f4fd', borderLeft: '4px solid #2196f3', padding: 10, borderRadius: 6, marginBottom: 12 }}>{t('ppe.rule')}</div>
      {summary && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          {[[t('ppe.compliance'), summary.rate + '%', '#1976d2'], [t('ppe.checks_today'), summary.total, '#1976d2'], [t('ppe.non_compliant'), summary.total - summary.compliant, (summary.total - summary.compliant) > 0 ? '#d32f2f' : '#2e7d32'], [t('ppe.masks_given'), summary.masksGiven, '#ef6c00']].map(([l, v, c], i) => (
            <div key={i} style={{ flex: '1 1 100px', background: 'var(--hms-surface)', borderRadius: 8, padding: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 'bold', color: c }}>{v}</div>
              <div style={{ fontSize: 12 }}>{l}</div>
            </div>
          ))}
        </div>
      )}
      {mode === 'admin' && (
        <form onSubmit={submit} style={{ display: 'grid', gap: 8, marginBottom: 14, background: '#fafafa', padding: 10, borderRadius: 8 }}>
          <strong>{t('ppe.log')}</strong>
          <input placeholder={t('ppe.name')} value={form.personName} onChange={e => setForm({ ...form, personName: e.target.value })} style={{ padding: 8 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={form.personRole} onChange={e => setForm({ ...form, personRole: e.target.value })} style={{ flex: 1, padding: 8 }}>
              {ROLES.map(r => <option key={r} value={r}>{rk(r)}</option>)}
            </select>
            <select value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })} style={{ flex: 1, padding: 8 }}>
              {ZONES.map(z => <option key={z} value={z}>{zk(z)}</option>)}
            </select>
          </div>
          <label><input type="checkbox" checked={form.maskWorn} onChange={e => setForm({ ...form, maskWorn: e.target.checked })} /> 😷 {t('ppe.mask')}</label>
          <label><input type="checkbox" checked={form.glovesWorn} onChange={e => setForm({ ...form, glovesWorn: e.target.checked })} /> 🧤 {t('ppe.gloves')}</label>
          {(!form.maskWorn || !form.glovesWorn) && (
            <label style={{ color: '#d32f2f' }}><input type="checkbox" checked={form.maskProvided} onChange={e => setForm({ ...form, maskProvided: e.target.checked })} /> {t('ppe.mask_given')}</label>
          )}
          <input placeholder={t('ppe.remarks')} value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} style={{ padding: 8 }} />
          <button type="submit" style={{ padding: 10, background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6 }}>{t('ppe.save')}</button>
        </form>
      )}
      {summary && summary.byZone && summary.byZone.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <strong>{t('ppe.by_zone')}</strong>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 6 }}>
            <tbody>
              {summary.byZone.map(z => (
                <tr key={z._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 6 }}>{zk(z._id)}</td>
                  <td style={{ padding: 6 }}>{z.ok}/{z.total}</td>
                  <td style={{ padding: 6, fontWeight: 'bold', color: z.total && (z.ok / z.total) < 0.8 ? '#d32f2f' : '#2e7d32' }}>{z.total ? Math.round(z.ok / z.total * 100) : 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div>
        <strong>{t('ppe.recent')}</strong>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ marginLeft: 8, padding: 4 }} />
        <div style={{ maxHeight: 220, overflowY: 'auto', marginTop: 6 }}>
          {checks.map(c => (
            <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 4px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
              <span>{c.personName} <small style={{ color: 'var(--hms-muted)' }}>({rk(c.personRole)} · {zk(c.zone)})</small></span>
              <span style={{ fontWeight: 'bold', color: c.compliant ? '#2e7d32' : '#d32f2f' }}>{c.compliant ? '✅ ' + t('ppe.ok') : '❌ ' + t('ppe.fail')}</span>
            </div>
          ))}
          {checks.length === 0 && <div style={{ color: 'var(--hms-muted)', fontSize: 13, padding: 8 }}>{t('ppe.no_data')}</div>}
        </div>
      </div>
    </div>
  );
}
