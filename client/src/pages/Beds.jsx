import { useEffect, useState } from 'react';
import API from '../api';

export default function Beds(){
  const [beds,setBeds]=useState([]);
  const [patients,setPatients]=useState([]);
  const [form,setForm]=useState({bedNo:'',ward:'',type:'General'});
  const [assign,setAssign]=useState({});

  const load=async()=>{
    const {data}=await API.get('/beds'); setBeds(data);
    const p=await API.get('/patients'); setPatients(p.data);
  };
  useEffect(()=>{load()},[]);

  const add=async(e)=>{
    e.preventDefault();
    await API.post('/beds',{bedNo:form.bedNo,ward:form.ward});
    setForm({bedNo:'',ward:''});
    load();
  };
  const doAssign=async(id)=>{
    if(!assign[id])return alert('Select patient');
    await API.patch('/beds/'+id+'/assign',{patientId:assign[id]});
    load();
  };
  const discharge=async(id)=>{
    if(!confirm('Discharge patient?'))return;
    await API.patch('/beds/'+id+'/discharge');
    load();
  };

  return (
    <div style={{padding:16,maxWidth:900,margin:'0 auto'}}>
      <h2 style={{color:'var(--hms-text)'}}>Bed Management</h2>
      <form onSubmit={add} style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:20,background:'#fff',padding:16,borderRadius:12}}>
        <input placeholder="Bed No" value={form.bedNo} onChange={e=>setForm({...form,bedNo:e.target.value})} required style={inp}/>
        <select value={form.ward} onChange={e=>setForm({...form,ward:e.target.value})} required style={inp}><option value="">Select Ward</option><option value="General">General</option><option value="ICU">ICU</option><option value="Emergency">Emergency</option><option value="Cabin">Cabin</option></select>
        <button type="submit" style={{gridColumn:'1/-1',padding:10,background:'#2563eb',color:'var(--hms-text)',border:'none',borderRadius:8,fontWeight:600}}>Add Bed</button>
      </form>
      {beds.map(b=>(
        <div key={b._id} style={{background:'#fff',padding:12,borderRadius:10,marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <b style={{color:'var(--hms-text)'}}>{b.bedNo} — {b.ward} </b>
            <div style={{fontSize:13,color:b.status==='available'?'#16a34a':'#ef4444',fontWeight:600}}>
              {b.status==='available' ? 'Available' : 'Occupied by '+b.patient?.name}
            </div>
          </div>
          {b.status==='available' ? (
            <div style={{display:'flex',gap:6}}>
              <select value={assign[b._id]||''} onChange={e=>setAssign({...assign,[b._id]:e.target.value})} style={inp}>
                <option value="">Select Patient</option>
                {patients.map(p=><option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
              <button onClick={()=>doAssign(b._id)} style={btn('#2563eb')}>Assign</button>
            </div>
          ) : (
            <button onClick={()=>discharge(b._id)} style={btn('#f59e0b')}>Discharge</button>
          )}
        </div>
      ))}
    </div>
  );
}
const inp={padding:8,border:'1px solid #cbd5e1',borderRadius:8,fontSize:14};
const btn=c=>({background:c,color:'var(--hms-text)',border:'none',borderRadius:6,padding:'8px 14px',fontSize:13});
