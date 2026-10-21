import { useEffect, useState } from 'react';
import API from '../api';

export default function Patients(){
  const [patients,setPatients]=useState([]);
  const [form,setForm]=useState({name:'',age:'',gender:'Male',phone:'',address:'',bloodGroup:''});

  const load=async()=>{
    const {data}=await API.get('/patients');
    setPatients(data);
  };
  useEffect(()=>{load()},[]);

  const add=async(e)=>{
    e.preventDefault();
    await API.post('/patients',{...form,gender:form.gender.toLowerCase(),age:form.age?Number(form.age):undefined});
    setForm({name:'',age:'',gender:'Male',phone:'',address:'',bloodGroup:''});
    load();
  };
  const del=async(id)=>{
    if(!confirm('Delete this patient?'))return;
    await API.delete('/patients/'+id);
    load();
  };

  return (
    <div style={{padding:16,maxWidth:900,margin:'0 auto'}}>
      <h2 style={{color:'#1e293b'}}>Patients</h2>
      <form onSubmit={add} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:20,background:'#fff',padding:16,borderRadius:12}}>
        <input placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required style={inp}/>
        <input placeholder="Age" type="number" value={form.age} onChange={e=>setForm({...form,age:e.target.value})} required style={inp}/>
        <select value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})} style={inp}>
          <option>Male</option><option>Female</option><option>Other</option>
        </select>
        <input placeholder="Phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} required style={inp}/>
        <input placeholder="Blood Group" value={form.bloodGroup} onChange={e=>setForm({...form,bloodGroup:e.target.value})} style={inp}/>
        <input placeholder="Address" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} style={inp}/>
        <button type="submit" style={{gridColumn:'1/-1',padding:10,background:'#2563eb',color:'#fff',border:'none',borderRadius:8,fontWeight:600}}>Add Patient</button>
      </form>
      {patients.map(p=>(
        <div key={p._id} style={{background:'#fff',padding:12,borderRadius:10,marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <b style={{color:'#1e293b'}}>{p.patientId} — {p.name}</b>
            <div style={{fontSize:13,color:'#64748b'}}>{p.age} yrs, {p.gender}, {p.phone}</div>
          </div>
          <button onClick={()=>del(p._id)} style={{background:'#ef4444',color:'#fff',border:'none',borderRadius:6,padding:'6px 12px'}}>Delete</button>
        </div>
      ))}
    </div>
  );
}
const inp={padding:10,border:'1px solid #cbd5e1',borderRadius:8,fontSize:14};
