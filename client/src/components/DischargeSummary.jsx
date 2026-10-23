import { useEffect, useState } from 'react';
import api from '../api';
import { useLang } from '../i18n/LanguageContext.jsx';

const emptyF = { patientName: '', patientEmail: '', admissionDate: '', dischargeDate: '', department: '', diagnosis: '', proceduresDone: '', treatmentGiven: '', medications: [{ name: '', dosage: '', duration: '' }], followUpDate: '', followUpDoctor: '', dietAdvice: '', activityAdvice: '', conditionOnDischarge: 'Stable' };

export default function DischargeSummary({ mode }) {
  const { t } = useLang();
  const [list, setList] = useState([]);
  const [depts, setDepts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState(emptyF);
  const [me, setMe] = useState({ email: '', name: '' });

  const load = async () => {
    try {
      const m = await api.get('/auth/me');
      const email = m.data.email || '';
      setMe({ email, name: m.data.name || '' });
      let url = '/discharge';
      if (mode === 'patient') url += '?patientEmail=' + encodeURIComponent(email);
      const [d, dp] = await Promise.all([api.get(url), api.get('/departments')]);
      setList(d.data); setDepts(dp.data);
    } catch (e) { console.error(e); }
  };
  useEffect(() => { load(); }, []);

  const updMed = (i, k, v) => {
    const meds = f.medications.map((md, j) => (j === i ? { ...md, [k]: v } : md));
    setF({ ...f, medications: meds });
  };

  const save = async () => {
    if (!f.patientName.trim() || !f.diagnosis.trim()) { alert(t('dis.diagnosis')); return; }
    try {
      await api.post('/discharge', {
        ...f,
        proceduresDone: f.proceduresDone.split(',').map(s => s.trim()).filter(Boolean),
        medications: f.medications.filter(md => md.name.trim()),
        doctorName: me.name, preparedBy: me.name
      });
      setF(emptyF); setShowForm(false); load();
    } catch (e) { alert('Failed'); }
  };

  const complete = async (id) => {
    try { await api.patch(`/discharge/${id}`, { status: 'completed' }); load(); }
    catch (e) { alert('Failed'); }
  };

  const canEdit = mode === 'admin' || mode === 'doctor';

  const DocView = ({ d }) => (
    <div className="bg-white text-gray-900 p-4 rounded-xl text-xs space-y-2">
      <div className="text-center border-b pb-2">
        <div className="font-bold text-base">CityCare Hospital</div>
        <div className="text-gray-600">DISCHARGE SUMMARY</div>
      </div>
      <div className="grid grid-cols-2 gap-1">
        <div><b>Patient:</b> {d.patientName}</div>
        <div><b>Department:</b> {d.department}</div>
        <div><b>Admitted:</b> {d.admissionDate}</div>
        <div><b>Discharged:</b> {d.dischargeDate}</div>
        <div><b>Doctor:</b> {d.doctorName}</div>
        <div><b>Condition:</b> {d.conditionOnDischarge}</div>
      </div>
      <div><b>Diagnosis:</b> {d.diagnosis}</div>
      {(d.proceduresDone || []).length > 0 && <div><b>Procedures:</b> {d.proceduresDone.join(', ')}</div>}
      {d.treatmentGiven && <div><b>Treatment:</b> {d.treatmentGiven}</div>}
      {(d.medications || []).length > 0 && (
        <div><b>Medications:</b>
          <ul className="list-disc ml-4">{d.medications.map((md, i) => <li key={i}>{md.name} - {md.dosage} - {md.duration}</li>)}</ul>
        </div>
      )}
      {d.dietAdvice && <div><b>Diet:</b> {d.dietAdvice}</div>}
      {d.activityAdvice && <div><b>Activity:</b> {d.activityAdvice}</div>}
      {(d.followUpDate || d.followUpDoctor) && <div><b>Follow-up:</b> {d.followUpDate} {d.followUpDoctor ? 'with ' + d.followUpDoctor : ''}</div>}
    </div>
  );

  return (
    <div className="space-y-3">
      <h3 className="font-bold">📄 {mode === 'patient' ? t('dis.my') : t('dis.title')} ({list.length})</h3>
      {canEdit && (
        <button onClick={() => setShowForm(!showForm)} className="w-full bg-teal-600 py-2 rounded-xl text-sm font-bold">{t('dis.new')}</button>
      )}
      {showForm && canEdit && (
        <div className="bg-gray-800 p-3 rounded-xl space-y-2">
          <div className="flex gap-2">
            <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('common.name') + ' *'} value={f.patientName} onChange={e => setF({ ...f, patientName: e.target.value })} />
            <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('common.email')} value={f.patientEmail} onChange={e => setF({ ...f, patientEmail: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <input type="date" className="flex-1 bg-gray-700 p-2 rounded text-sm" value={f.admissionDate} onChange={e => setF({ ...f, admissionDate: e.target.value })} />
            <input type="date" className="flex-1 bg-gray-700 p-2 rounded text-sm" value={f.dischargeDate} onChange={e => setF({ ...f, dischargeDate: e.target.value })} />
          </div>
          <select className="w-full bg-gray-700 p-2 rounded text-sm" value={f.department} onChange={e => setF({ ...f, department: e.target.value })}>
            <option value="">{t('dis.dept')}</option>
            {depts.map(d => <option key={d.code} value={d.name}>{d.name}</option>)}
          </select>
          <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('dis.diagnosis')} value={f.diagnosis} onChange={e => setF({ ...f, diagnosis: e.target.value })} />
          <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('dis.procedures')} value={f.proceduresDone} onChange={e => setF({ ...f, proceduresDone: e.target.value })} />
          <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('dis.treatment')} value={f.treatmentGiven} onChange={e => setF({ ...f, treatmentGiven: e.target.value })} />
          <div className="text-xs font-bold text-gray-400">{t('dis.meds')}</div>
          {f.medications.map((md, i) => (
            <div key={i} className="flex gap-2">
              <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('dis.med_name')} value={md.name} onChange={e => updMed(i, 'name', e.target.value)} />
              <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('dis.dosage')} value={md.dosage} onChange={e => updMed(i, 'dosage', e.target.value)} />
              <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('dis.duration')} value={md.duration} onChange={e => updMed(i, 'duration', e.target.value)} />
            </div>
          ))}
          <button onClick={() => setF({ ...f, medications: [...f.medications, { name: '', dosage: '', duration: '' }] })} className="text-xs bg-gray-700 px-3 py-1 rounded">{t('dis.add_med')}</button>
          <div className="flex gap-2">
            <input type="date" className="flex-1 bg-gray-700 p-2 rounded text-sm" value={f.followUpDate} onChange={e => setF({ ...f, followUpDate: e.target.value })} />
            <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('dis.followup_dr')} value={f.followUpDoctor} onChange={e => setF({ ...f, followUpDoctor: e.target.value })} />
          </div>
          <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('dis.diet')} value={f.dietAdvice} onChange={e => setF({ ...f, dietAdvice: e.target.value })} />
          <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('dis.activity')} value={f.activityAdvice} onChange={e => setF({ ...f, activityAdvice: e.target.value })} />
          <select className="w-full bg-gray-700 p-2 rounded text-sm" value={f.conditionOnDischarge} onChange={e => setF({ ...f, conditionOnDischarge: e.target.value })}>
            <option>Stable</option><option>Improved</option><option>Recovered</option><option>Referred</option>
          </select>
          <button onClick={save} className="w-full bg-blue-600 py-2 rounded-xl text-sm font-bold">{t('common.save')}</button>
        </div>
      )}
      <div className="space-y-3">
        {list.map(d => (
          <div key={d._id} className="space-y-2">
            <DocView d={d} />
            {canEdit && d.status === 'ready' && (
              <button onClick={() => complete(d._id)} className="w-full bg-green-600 py-1 rounded text-sm font-bold">{t('dis.complete')}</button>
            )}
            {d.status === 'completed' && <div className="text-xs text-green-400 font-bold text-center">✓ COMPLETED</div>}
          </div>
        ))}
        {list.length === 0 && <p className="text-gray-500 text-xs">{t('dis.no_dis')}</p>}
      </div>
    </div>
  );
}
