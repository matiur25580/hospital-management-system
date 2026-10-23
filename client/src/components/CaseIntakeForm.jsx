import { useState } from 'react';
import api from '../api';

const FILE_ROOT = (api.defaults.baseURL || 'http://localhost:5000/api').replace(/\/api$/, '');

export default function CaseIntakeForm({ initialName = '', initialEmail = '', lockIdentity = false, onSubmitted }) {
  const [f, setF] = useState({
    patientName: initialName, patientEmail: initialEmail,
    age: '', gender: '', phone: '', address: '',
    disease: '', symptoms: '', duration: '', medicalHistory: '', allergies: ''
  });
  const [done, setDone] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setF({ ...f, [k]: v });
  const inp = 'w-full bg-gray-700 p-2 rounded';

  const submit = async () => {
    if (!f.patientName.trim() || !f.patientEmail.trim() || !f.age.trim() || !f.gender || !f.phone.trim() || !f.address.trim() || !f.disease.trim() || !f.duration.trim()) {
      alert('Please fill all mandatory (*) fields'); return;
    }
    setSaving(true);
    try {
      const { data } = await api.post('/cases', f);
      setDone(data);
      setF({ patientName: lockIdentity ? initialName : '', patientEmail: lockIdentity ? initialEmail : '', age: '', gender: '', phone: '', address: '', disease: '', symptoms: '', duration: '', medicalHistory: '', allergies: '' });
      if (onSubmitted) onSubmitted();
    } catch (e) { alert('Failed: ' + (e.response?.data?.message || e.message)); }
    setSaving(false);
  };

  return (
    <div className="bg-gray-800 p-4 rounded-xl space-y-2">
      {done ? (
        <div className="bg-green-900 p-4 rounded-xl space-y-2">
          <div className="font-bold">Case submitted successfully ✓</div>
          <div className="text-sm text-gray-300">Submission time: {new Date(done.submittedAt).toLocaleString()}</div>
          {done.pdfUrl && <div><a href={FILE_ROOT + done.pdfUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-300 underline">Download Case PDF</a></div>}
          <div><button onClick={() => setDone(null)} className="text-sm text-gray-300 underline">Submit another case</button></div>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <input className={inp + ' flex-1'} placeholder="Patient full name *"
              value={f.patientName} disabled={lockIdentity} onChange={e => set('patientName', e.target.value)} />
            <input className={inp + ' w-20'} placeholder="Age *" value={f.age} onChange={e => set('age', e.target.value)} />
          </div>
          <div className="flex gap-2">
            <input className={inp + ' flex-1'} placeholder="Patient email *"
              value={f.patientEmail} disabled={lockIdentity} onChange={e => set('patientEmail', e.target.value)} />
            <select className={inp + ' flex-1'} value={f.gender} onChange={e => set('gender', e.target.value)}>
              <option value="">Gender *</option><option>Male</option><option>Female</option><option>Other</option>
            </select>
          </div>
          <input className={inp} placeholder="Phone number *" value={f.phone} onChange={e => set('phone', e.target.value)} />
          <input className={inp} placeholder="Address (village/town, district) *" value={f.address} onChange={e => set('address', e.target.value)} />
          <input className={inp} placeholder="Disease / chief complaint (ki rog) *" value={f.disease} onChange={e => set('disease', e.target.value)} />
          <input className={inp} placeholder="Symptoms (uposorgo)" value={f.symptoms} onChange={e => set('symptoms', e.target.value)} />
          <input className={inp} placeholder="Duration (koto din dhore hocche) *" value={f.duration} onChange={e => set('duration', e.target.value)} />
          <input className={inp} placeholder="Previous medical history" value={f.medicalHistory} onChange={e => set('medicalHistory', e.target.value)} />
          <input className={inp} placeholder="Allergies" value={f.allergies} onChange={e => set('allergies', e.target.value)} />
          <button onClick={submit} disabled={saving} className="w-full bg-blue-600 py-2 rounded-xl font-bold disabled:opacity-50">
            {saving ? 'Submitting & generating PDF...' : 'Final Submit'}
          </button>
        </>
      )}
    </div>
  );
}
