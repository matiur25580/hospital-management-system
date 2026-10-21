import { useEffect, useState } from 'react';
import API from '../api';

export default function Appointments(){
  const [list,setList]=useState([]);
  const [patients,setPatients]=useState([]);
  const [doctors,setDoctors]=useState([]);
  const [form,setForm]=useState({patient:'',doctor:'',date:'',reason:''});

  const load=async()=>{
    const {data}=await API.get('/appointments');
    setList(data);
    const p=await API.get('/patients'); setPatients(p.data);
    const d=await API.get('/doctors'); setDoctors(d.data);
  };
  useEffect(()=>{load()},[]);

  const book=async(e)=>{
    e.preventDefault();
    await API.post('/appointments',form);
    setForm({patient:'',doctor:'',date:'',reason:''});
    load();
  };
  const setStatus=async(id,status)=>{
    await API.patch('/appointments/'+id+'/status',{status});
    load();
  };

  return (
    <div style={{padding:16,maxWidth:900,margin:'0 auto'}}>
      <h2 style={{color:'#1e293b'}}>Appointments</h2>
      <form onSubmit={book} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:20,background:'#fff',padding:16,borderRadius:12}}>
        <select value={form.patient} onChange={e=>setForm({...form,patient:e.target.value})} required style={inp}>
          <option value="">Select Patient</option>
          {patients.map(p=><option key={p._id} value={p._id}>{p.patientId} — {p.name}</option>)}
        </select>
        <select value={form.doctor} onChange={e=>setForm({...form,doctor:e.target.value})} required style={inp}>
          <option value="">Select Doctor</option>
          {doctors.map(d=><option key={d._id} value={d._id}>{d.name} ({d.specialization})</option>)}
        </select>
        <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} required style={inp}/>
        <input placeholder="Reason" value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})} style={inp}/>
        <button type="submit" style={{gridColumn:'1/-1',padding:10,background:'#2563eb',color:'#fff',border:'none',borderRadius:8,fontWeight:600}}>Book Appointment</button>
      </form>
      {list.map(a=>(
        <div key={a._id} style={{background:'#fff',padding:12,borderRadius:10,marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <b style={{color:'#1e293b'}}>Token #{a.tokenNo} — {a.patient?.name}</b>
            <div style={{fontSize:13,color:'#64748b'}}>Dr. {a.doctor?.name} | {a.date?.slice(0,10)} | {a.status}</div>
          </div>
          <div style={{display:'flex',gap:6}}>
            <button onClick={()=>setStatus(a._id,'completed')} style={btn('#16a34a')}>Done</button>
            <button onClick={()=>setStatus(a._id,'cancelled')} style={btn('#ef4444')}>Cancel</button>
          </div>
        </div>
      ))}
    </div>
  );
}
const inp={padding:10,border:'1px solid #cbd5e1',borderRadius:8,fontSize:14};
const btn=c=>({background:c,color:'#fff',border:'none',borderRadius:6,padding:'6px 12px',fontSize:13});
