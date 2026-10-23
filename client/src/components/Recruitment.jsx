import { useEffect, useState } from 'react';
import api from '../api';
import { useLang } from '../i18n/LanguageContext.jsx';

const STAGES = ['applied', 'screening', 'interview', 'offered', 'hired', 'rejected'];

export default function Recruitment() {
  const { t } = useLang();
  const [jobs, setJobs] = useState([]);
  const [selJob, setSelJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [showJob, setShowJob] = useState(false);
  const [showAp, setShowAp] = useState(false);
  const [jf, setJf] = useState({ title: '', department: '', designation: '', employmentType: 'private', vacancies: '', qualification: '', experience: '', salaryRange: '', description: '' });
  const [af, setAf] = useState({ name: '', email: '', phone: '', qualification: '', experienceYears: '', resumeNote: '' });
  const [me, setMe] = useState('');

  const loadJobs = async () => {
    try {
      const [j, m] = await Promise.all([api.get('/recruitment/jobs'), api.get('/auth/me')]);
      setJobs(j.data); setMe(m.data.name || '');
    } catch (e) { console.error(e); }
  };
  const loadApplicants = async (jobId) => {
    try { const { data } = await api.get(`/recruitment/applicants?jobId=${jobId}`); setApplicants(data); }
    catch (e) { console.error(e); }
  };
  useEffect(() => { loadJobs(); }, []);

  const postJob = async () => {
    if (!jf.title.trim() || !jf.designation.trim()) { alert(t('rc.description')); return; }
    try {
      await api.post('/recruitment/jobs', { ...jf, vacancies: Number(jf.vacancies) || 1, postedBy: me });
      setJf({ title: '', department: '', designation: '', employmentType: 'private', vacancies: '', qualification: '', experience: '', salaryRange: '', description: '' });
      setShowJob(false); loadJobs();
    } catch (e) { alert('Failed'); }
  };
  const closeJob = async (id) => {
    try { await api.patch(`/recruitment/jobs/${id}`, { status: 'closed' }); loadJobs(); }
    catch (e) { alert('Failed'); }
  };
  const addApplicant = async () => {
    if (!af.name.trim() || !selJob) { alert(t('common.name')); return; }
    try {
      await api.post('/recruitment/applicants', { ...af, jobId: selJob._id, experienceYears: Number(af.experienceYears) || 0 });
      setAf({ name: '', email: '', phone: '', qualification: '', experienceYears: '', resumeNote: '' });
      setShowAp(false); loadApplicants(selJob._id);
    } catch (e) { alert('Failed'); }
  };
  const setStage = async (id, stage, extra = {}) => {
    try { await api.patch(`/recruitment/applicants/${id}`, { stage, decidedBy: me, ...extra }); loadApplicants(selJob._id); }
    catch (e) { alert('Failed'); }
  };
  const hire = async (id) => {
    if (!confirm(t('rc.hire') + '?')) return;
    try {
      const { data } = await api.post(`/recruitment/applicants/${id}/hire`, { decidedBy: me });
      alert(t('rc.hired_msg') + ' (' + data.userRole + ')');
      loadApplicants(selJob._id);
    } catch (e) { alert('Failed: ' + (e.response?.data?.message || e.message)); }
  };

  const stColor = { applied: 'bg-gray-600', screening: 'bg-blue-700', interview: 'bg-purple-700', offered: 'bg-yellow-700', hired: 'bg-green-700', rejected: 'bg-red-700' };
  const openJobs = jobs.filter(j => j.status === 'open');

  return (
    <div className="space-y-3">
      <h3 className="font-bold">📝 {t('rc.title')}</h3>
      <button onClick={() => setShowJob(!showJob)} className="w-full bg-teal-600 py-2 rounded-xl text-sm font-bold">{t('rc.post_job')}</button>
      {showJob && (
        <div className="bg-gray-800 p-3 rounded-xl space-y-2">
          <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('rc.description') + ': title * (e.g. Staff Nurse)'} value={jf.title} onChange={e => setJf({ ...jf, title: e.target.value })} />
          <div className="flex gap-2">
            <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('hr.designation') + ' *'} value={jf.designation} onChange={e => setJf({ ...jf, designation: e.target.value })} />
            <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('hr.dept')} value={jf.department} onChange={e => setJf({ ...jf, department: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <select className="flex-1 bg-gray-700 p-2 rounded text-sm" value={jf.employmentType} onChange={e => setJf({ ...jf, employmentType: e.target.value })}>
              <option value="private">{t('hr.private')}</option><option value="government">{t('hr.govt')}</option>
            </select>
            <input type="number" className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('rc.vacancies')} value={jf.vacancies} onChange={e => setJf({ ...jf, vacancies: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('rc.qualification')} value={jf.qualification} onChange={e => setJf({ ...jf, qualification: e.target.value })} />
            <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('rc.experience')} value={jf.experience} onChange={e => setJf({ ...jf, experience: e.target.value })} />
          </div>
          <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('rc.salary_range') + ' (e.g. Rs. 20,000-25,000)'} value={jf.salaryRange} onChange={e => setJf({ ...jf, salaryRange: e.target.value })} />
          <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('rc.description')} value={jf.description} onChange={e => setJf({ ...jf, description: e.target.value })} />
          <button onClick={postJob} className="w-full bg-blue-600 py-2 rounded-xl text-sm font-bold">{t('common.save')}</button>
        </div>
      )}

      <div className="text-xs font-bold text-gray-400">{t('rc.jobs')} ({openJobs.length})</div>
      <div className="space-y-2">
        {openJobs.map(j => (
          <div key={j._id} className={`bg-gray-800 p-3 rounded-xl text-xs ${selJob && selJob._id === j._id ? 'border border-blue-600' : ''}`}>
            <div className="flex justify-between items-center">
              <div className="font-semibold text-sm">{j.title} <span className="text-gray-500 font-normal">({j.vacancies} {t('rc.vacancies')})</span></div>
              <span className="text-xs bg-green-700 px-2 py-1 rounded font-bold">{j.status.toUpperCase()}</span>
            </div>
            <div className="text-gray-500 mt-1">{j.designation} • {j.department} • {j.qualification} • {j.salaryRange}</div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => { setSelJob(j); loadApplicants(j._id); }} className="bg-blue-600 px-3 py-1 rounded font-bold">{t('rc.applicants')}</button>
              <button onClick={() => closeJob(j._id)} className="bg-gray-600 px-3 py-1 rounded">{t('rc.close')}</button>
            </div>
          </div>
        ))}
        {openJobs.length === 0 && <p className="text-gray-500 text-xs">{t('rc.no_jobs')}</p>}
      </div>

      {selJob && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="text-xs font-bold text-gray-400">{t('rc.applicants')}: {selJob.title} ({applicants.length})</div>
            <button onClick={() => setShowAp(!showAp)} className="bg-teal-600 px-3 py-1 rounded text-xs font-bold">{t('rc.add_applicant')}</button>
          </div>
          {showAp && (
            <div className="bg-gray-800 p-3 rounded-xl space-y-2">
              <div className="flex gap-2">
                <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('common.name') + ' *'} value={af.name} onChange={e => setAf({ ...af, name: e.target.value })} />
                <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('rc.phone')} value={af.phone} onChange={e => setAf({ ...af, phone: e.target.value })} />
              </div>
              <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('common.email')} value={af.email} onChange={e => setAf({ ...af, email: e.target.value })} />
              <div className="flex gap-2">
                <input className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('rc.qualification')} value={af.qualification} onChange={e => setAf({ ...af, qualification: e.target.value })} />
                <input type="number" className="flex-1 bg-gray-700 p-2 rounded text-sm" placeholder={t('rc.exp_years')} value={af.experienceYears} onChange={e => setAf({ ...af, experienceYears: e.target.value })} />
              </div>
              <input className="w-full bg-gray-700 p-2 rounded text-sm" placeholder={t('rc.note')} value={af.resumeNote} onChange={e => setAf({ ...af, resumeNote: e.target.value })} />
              <button onClick={addApplicant} className="w-full bg-blue-600 py-2 rounded-xl text-sm font-bold">{t('common.save')}</button>
            </div>
          )}
          {applicants.map(a => (
            <div key={a._id} className="bg-gray-800 p-3 rounded-xl text-xs">
              <div className="flex justify-between items-center">
                <div className="font-semibold text-sm">{a.name} <span className="text-gray-500 font-normal">{a.qualification} • {a.experienceYears}y exp</span></div>
                <span className={`px-2 py-1 rounded font-bold ${stColor[a.stage]}`}>{t('rc.st_' + a.stage).toUpperCase()}</span>
              </div>
              <div className="text-gray-500 mt-1">{a.phone} • {a.email}</div>
              {a.resumeNote && <div className="text-gray-500">{a.resumeNote}</div>}
              {a.interviewDate && <div className="text-purple-300">{t('rc.interview_date')}: {a.interviewDate}</div>}
              {a.stage !== 'hired' && a.stage !== 'rejected' && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {STAGES.filter(s => !['hired', 'applied'].includes(s)).map(s => (
                    <button key={s} onClick={() => {
                      if (s === 'interview') { const dt = prompt(t('rc.set_interview') + ' (YYYY-MM-DD)'); if (dt) setStage(a._id, s, { interviewDate: dt }); }
                      else setStage(a._id, s);
                    }} className="bg-gray-700 px-2 py-1 rounded text-xs">{t('rc.st_' + s)}</button>
                  ))}
                  <button onClick={() => hire(a._id)} className="bg-green-600 px-3 py-1 rounded text-xs font-bold">{t('rc.hire')}</button>
                </div>
              )}
            </div>
          ))}
          {applicants.length === 0 && <p className="text-gray-500 text-xs">{t('rc.no_applicants')}</p>}
        </div>
      )}
    </div>
  );
}
