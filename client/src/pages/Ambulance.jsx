import { useEffect, useState } from 'react';
import API from '../api';
const inp={padding:8,borderRadius:8,border:'1px solid #cbd5e1',width:'100%',boxSizing:'border-box'};
const btn=c=>({padding:'8px 12px',background:c,color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer'});
const card={background:'#fff',padding:12,borderRadius:10,marginBottom:8};
const STAGES=['dispatched','en-route','on-scene','to-hospital','completed'];

export default function Ambulance(){
  const [fleet,setFleet]=useState([]);
  const [trips,setTrips]=useState([]);
  const [form,setForm]=useState({vehicleNo:'',driverName:'',driverPhone:'',type:'basic',baseLocation:''});
  const [disp,setDisp]=useState({ambulanceId:'',patientName:'',patientPhone:'',pickupLocation:'',destination:'',notes:''});

  const load=async()=>{
    const {data}=await API.get('/ambulance'); setFleet(data);
    const t=await API.get('/ambulance/trips'); setTrips(t.data);
  };
  useEffect(()=>{load()},[]);

  const add=async(e)=>{e.preventDefault();
    await API.post('/ambulance',form);
    setForm({vehicleNo:'',driverName:'',driverPhone:'',type:'basic',baseLocation:''}); load();};

  const setStatus=async(id,status)=>{
    await API.patch('/ambulance/'+id,{status}); load();};

  const del=async(id)=>{if(!confirm('Delete ambulance?'))return;
    await API.delete('/ambulance/'+id); load();};

  const dispatch=async(e)=>{e.preventDefault();
    if(!disp.ambulanceId)return alert('Select ambulance');
    try{await API.post('/ambulance/dispatch',disp);
      setDisp({ambulanceId:'',patientName:'',patientPhone:'',pickupLocation:'',destination:'',notes:''});
    }catch(err){alert(err.response?.data?.message||'Dispatch failed');}
    load();};

  const advance=async(t)=>{
    const i=STAGES.indexOf(t.status);
    const next=STAGES[i+1]; if(!next)return;
    await API.patch('/ambulance/trips/'+t._id,{status:next}); load();};

  const cancel=async(t)=>{if(!confirm('Cancel this trip?'))return;
    await API.patch('/ambulance/trips/'+t._id,{status:'cancelled'}); load();};

  const available=fleet.filter(a=>a.status==='available');
  const activeTrips=trips.filter(t=>!['completed','cancelled'].includes(t.status));

  return (
    <div style={{padding:16,maxWidth:900,margin:'0 auto'}}>
      <h2 style={{color:'var(--hms-text)'}}>Ambulance Service</h2>

      <h3 style={{color:'var(--hms-text)'}}>🚑 Dispatch Ambulance</h3>
      <form onSubmit={dispatch} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:20,background:'#fff',padding:16,borderRadius:12}}>
        <select value={disp.ambulanceId} onChange={e=>setDisp({...disp,ambulanceId:e.target.value})} required style={inp}>
          <option value="">Select Available Ambulance</option>
          {available.map(a=><option key={a._id} value={a._id}>{a.vehicleNo} — {a.driverName} ({a.type})</option>)}
        </select>
        <input placeholder="Patient Name *" value={disp.patientName} onChange={e=>setDisp({...disp,patientName:e.target.value})} required style={inp}/>
        <input placeholder="Patient Phone" value={disp.patientPhone} onChange={e=>setDisp({...disp,patientPhone:e.target.value})} style={inp}/>
        <input placeholder="Pickup Location *" value={disp.pickupLocation} onChange={e=>setDisp({...disp,pickupLocation:e.target.value})} required style={inp}/>
        <input placeholder="Destination (default: Hospital)" value={disp.destination} onChange={e=>setDisp({...disp,destination:e.target.value})} style={inp}/>
        <input placeholder="Notes" value={disp.notes} onChange={e=>setDisp({...disp,notes:e.target.value})} style={inp}/>
        <button type="submit" style={{...btn('#dc2626'),gridColumn:'1/-1',padding:10}}>🚨 Dispatch Now</button>
      </form>

      <h3 style={{color:'var(--hms-text)'}}>🟢 Active Trips ({activeTrips.length})</h3>
      {activeTrips.map(t=>(
        <div key={t._id} style={{...card,borderLeft:'4px solid #dc2626'}}>
          <b style={{color:'var(--hms-text)'}}>{t.vehicleNo}</b>
          <span style={{fontSize:12,color:'#64748b'}}> · {t.driverName} ({t.driverPhone})</span>
          <div style={{fontSize:13}}>Patient: {t.patientName} {t.patientPhone?`(${t.patientPhone})`:''}</div>
          <div style={{fontSize:13,color:'#475569'}}>📍 {t.pickupLocation} → {t.destination}</div>
          <div style={{fontSize:12,fontWeight:700,color:'#dc2626',marginTop:4}}>Stage: {t.status.toUpperCase()}</div>
          <div style={{display:'flex',gap:6,marginTop:8}}>
            <button onClick={()=>advance(t)} style={btn('#2563eb')}>Next Stage →</button>
            <button onClick={()=>cancel(t)} style={btn('#94a3b8')}>Cancel</button>
          </div>
        </div>
      ))}
      {activeTrips.length===0&&<div style={{color:'#94a3b8',fontSize:13,marginBottom:12}}>No active trips</div>}

      <h3 style={{color:'var(--hms-text)'}}>Fleet Management</h3>
      <form onSubmit={add} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16,background:'#fff',padding:16,borderRadius:12}}>
        <input placeholder="Vehicle No *" value={form.vehicleNo} onChange={e=>setForm({...form,vehicleNo:e.target.value})} required style={inp}/>
        <input placeholder="Driver Name" value={form.driverName} onChange={e=>setForm({...form,driverName:e.target.value})} style={inp}/>
        <input placeholder="Driver Phone" value={form.driverPhone} onChange={e=>setForm({...form,driverPhone:e.target.value})} style={inp}/>
        <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} style={inp}>
          <option value="basic">Basic</option><option value="advanced">Advanced (ICU)</option>
        </select>
        <input placeholder="Base Location" value={form.baseLocation} onChange={e=>setForm({...form,baseLocation:e.target.value})} style={inp}/>
        <button type="submit" style={{...btn('#2563eb'),gridColumn:'1/-1',padding:10}}>Add Ambulance</button>
      </form>
      {fleet.map(a=>(
        <div key={a._id} style={{...card,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
          <div>
            <b style={{color:'var(--hms-text)'}}>{a.vehicleNo}</b>
            <span style={{fontSize:12,color:'#64748b'}}> · {a.driverName} ({a.driverPhone}) · {a.type}</span>
            <div style={{fontSize:13,fontWeight:600,color:a.status==='available'?'#16a34a':a.status==='on-trip'?'#dc2626':'#d97706'}}>{a.status.toUpperCase()} {a.baseLocation?'· '+a.baseLocation:''}</div>
          </div>
          <div style={{display:'flex',gap:6}}>
            <select value={a.status} onChange={e=>setStatus(a._id,e.target.value)} style={{...inp,width:'auto'}}>
              <option value="available">Available</option>
              <option value="on-trip">On Trip</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <button onClick={()=>del(a._id)} style={btn('#ef4444')}>✕</button>
          </div>
        </div>
      ))}

      <h3 style={{color:'var(--hms-text)'}}>Trip History</h3>
      {trips.filter(t=>['completed','cancelled'].includes(t.status)).slice(0,10).map(t=>(
        <div key={t._id} style={{...card,fontSize:13}}>
          <b>{t.vehicleNo}</b> · {t.patientName} · {t.pickupLocation} → {t.destination}
          <span style={{color:t.status==='completed'?'#16a34a':'#94a3b8'}}> · {t.status}</span>
          <span style={{color:'#94a3b8'}}> · {new Date(t.dispatchedAt).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
