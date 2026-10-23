import { useEffect, useState } from 'react';
import API from '../api';
const inp={padding:8,borderRadius:8,border:'1px solid #cbd5e1',width:'100%',boxSizing:'border-box'};
const btn=c=>({padding:'8px 12px',background:c,color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer'});
const card={background:'#fff',padding:12,borderRadius:10,marginBottom:8};

export default function LabReports(){
  const [list,setList]=useState([]);
  const [stats,setStats]=useState({pending:0,reviewed:0,retest:0,critical:0});
  const [filter,setFilter]=useState('all');
  const [form,setForm]=useState({patientEmail:'',patientName:'',testName:'',testCategory:'',result:'',normalRange:'',isCritical:false});
  const [note,setNote]=useState({});

  const load=async()=>{
    const {data}=await API.get('/lab-reports'); setList(data);
    try{const s=await API.get('/lab-reports/stats/summary'); setStats(s.data);}catch(e){}
  };
  useEffect(()=>{load()},[]);

  const add=async(e)=>{e.preventDefault();
    await API.post('/lab-reports',form);
    setForm({patientEmail:'',patientName:'',testName:'',testCategory:'',result:'',normalRange:'',isCritical:false}); load();};

  const doReview=async(id,status)=>{
    await API.patch('/lab-reports/'+id,{status,reviewNote:note[id]||''}); load();};
  const del=async(id)=>{if(!confirm('Delete this report?'))return;
    await API.delete('/lab-reports/'+id); load();};

  const shown=filter==='all'?list:list.filter(x=>x.status===filter);
  const sc={background:'#fff',padding:12,borderRadius:10,flex:1,textAlign:'center'};

  return (
    <div style={{padding:16,maxWidth:900,margin:'0 auto'}}>
      <h2 style={{color:'var(--hms-text)'}}>Lab Reports</h2>
      <div style={{display:'flex',gap:8,marginBottom:16}}>
        <div style={sc}><b>{stats.pending}</b><div style={{fontSize:12}}>Pending</div></div>
        <div style={sc}><b>{stats.critical}</b><div style={{fontSize:12,color:'#ef4444'}}>Critical</div></div>
        <div style={sc}><b>{stats.reviewed}</b><div style={{fontSize:12}}>Reviewed</div></div>
        <div style={sc}><b>{stats.retest}</b><div style={{fontSize:12}}>Retest</div></div>
      </div>
      <form onSubmit={add} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:20,background:'#fff',padding:16,borderRadius:12}}>
        <input placeholder="Patient Email *" value={form.patientEmail} onChange={e=>setForm({...form,patientEmail:e.target.value})} required style={inp}/>
        <input placeholder="Patient Name" value={form.patientName} onChange={e=>setForm({...form,patientName:e.target.value})} style={inp}/>
        <input placeholder="Test Name *" value={form.testName} onChange={e=>setForm({...form,testName:e.target.value})} required style={inp}/>
        <input placeholder="Category (Blood/Urine/X-Ray...)" value={form.testCategory} onChange={e=>setForm({...form,testCategory:e.target.value})} style={inp}/>
        <input placeholder="Result" value={form.result} onChange={e=>setForm({...form,result:e.target.value})} style={inp}/>
        <input placeholder="Normal Range" value={form.normalRange} onChange={e=>setForm({...form,normalRange:e.target.value})} style={inp}/>
        <label style={{display:'flex',alignItems:'center',gap:6,fontSize:14}}>
          <input type="checkbox" checked={form.isCritical} onChange={e=>setForm({...form,isCritical:e.target.checked})}/> Critical Result
        </label>
        <button type="submit" style={{...btn('#2563eb'),gridColumn:'1/-1',padding:10}}>Add Lab Report</button>
      </form>
      <div style={{display:'flex',gap:6,marginBottom:12}}>
        {['all','pending','reviewed','retest'].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={btn(filter===f?'#2563eb':'#94a3b8')}>{f}</button>
        ))}
      </div>
      {shown.map(x=>(
        <div key={x._id} style={{...card,borderLeft:x.isCritical?'4px solid #ef4444':'4px solid #e2e8f0'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <b style={{color:'var(--hms-text)'}}>{x.testName}</b>
            <span style={{fontSize:12,fontWeight:700,color:x.status==='pending'?'#d97706':x.status==='reviewed'?'#16a34a':'#7c3aed'}}>{x.status.toUpperCase()}</span>
          </div>
          <div style={{fontSize:13,color:'#475569'}}>{x.patientName} ({x.patientEmail}) {x.testCategory?'· '+x.testCategory:''}</div>
          {x.result&&<div style={{fontSize:13,marginTop:4}}>Result: <b>{x.result}</b> {x.normalRange&&<span style={{color:'#64748b'}}>(Normal: {x.normalRange})</span>}</div>}
          {x.reviewNote&&<div style={{fontSize:13,color:'#7c3aed'}}>Note: {x.reviewNote}</div>}
          {x.status==='pending'&&(
            <div style={{display:'flex',gap:6,marginTop:8}}>
              <input placeholder="Review note" value={note[x._id]||''} onChange={e=>setNote({...note,[x._id]:e.target.value})} style={{...inp,width:'auto',flex:1}}/>
              <button onClick={()=>doReview(x._id,'reviewed')} style={btn('#16a34a')}>Approve</button>
              <button onClick={()=>doReview(x._id,'retest')} style={btn('#7c3aed')}>Retest</button>
            </div>
          )}
          <button onClick={()=>del(x._id)} style={{...btn('#ef4444'),marginTop:8,fontSize:12}}>Delete</button>
        </div>
      ))}
      {shown.length===0&&<div style={{color:'#94a3b8',textAlign:'center',padding:20}}>No reports</div>}
    </div>
  );
}
