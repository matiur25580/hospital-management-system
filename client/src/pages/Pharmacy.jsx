import { useEffect, useState } from 'react';
import API from '../api';
const inp={padding:8,borderRadius:8,border:'1px solid #cbd5e1',width:'100%',boxSizing:'border-box'};
const btn=c=>({padding:'8px 12px',background:c,color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer'});
const card={background:'#fff',padding:12,borderRadius:10,marginBottom:8};

export default function Pharmacy(){
  const [list,setList]=useState([]);
  const [lowStock,setLowStock]=useState([]);
  const [expiry,setExpiry]=useState([]);
  const [history,setHistory]=useState([]);
  const [showHist,setShowHist]=useState(false);
  const [form,setForm]=useState({name:'',genericName:'',batchNo:'',quantity:'',unit:'tablet',price:'',expiryDate:'',minStock:'10',supplier:''});
  const [qty,setQty]=useState({});

  const load=async()=>{
    const {data}=await API.get('/pharmacy'); setList(data);
    const l=await API.get('/pharmacy/alerts/low-stock'); setLowStock(l.data);
    const ex=await API.get('/pharmacy/alerts/expiry'); setExpiry(ex.data);
    const h=await API.get('/pharmacy/dispenses/history'); setHistory(h.data);
  };
  useEffect(()=>{load()},[]);

  const add=async(e)=>{e.preventDefault();
    await API.post('/pharmacy',{...form,quantity:Number(form.quantity)||0,price:Number(form.price)||0,minStock:Number(form.minStock)||10});
    setForm({name:'',genericName:'',batchNo:'',quantity:'',unit:'tablet',price:'',expiryDate:'',minStock:'10',supplier:''}); load();};

  const dispense=async(id)=>{
    const q=Number(qty[id]||0); if(!q)return alert('Enter quantity');
    const pn=prompt('Patient name:'); if(pn===null)return;
    try{const {data}=await API.post('/pharmacy/'+id+'/dispense',{quantity:q,patientName:pn});
      if(data.lowStock)alert('Warning: stock low for '+data.medicine.name);
    }catch(e){alert(e.response?.data?.message||'Failed');}
    load();};

  const restock=async(id)=>{
    const q=Number(qty[id]||0); if(!q)return alert('Enter quantity');
    await API.post('/pharmacy/'+id+'/restock',{quantity:q}); load();};

  const del=async(id)=>{if(!confirm('Delete medicine?'))return;
    await API.delete('/pharmacy/'+id); load();};

  return (
    <div style={{padding:16,maxWidth:900,margin:'0 auto'}}>
      <h2 style={{color:'var(--hms-text)'}}>Pharmacy</h2>
      {(lowStock.length>0||expiry.length>0)&&(
        <div style={{background:'#fef3c7',border:'1px solid #f59e0b',padding:12,borderRadius:10,marginBottom:16,fontSize:13}}>
          {lowStock.length>0&&<div>⚠️ <b>Low stock:</b> {lowStock.map(m=>m.name+' ('+m.quantity+')').join(', ')}</div>}
          {expiry.length>0&&<div>⏰ <b>Expiring soon:</b> {expiry.map(m=>m.name).join(', ')}</div>}
        </div>
      )}
      <form onSubmit={add} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:20,background:'#fff',padding:16,borderRadius:12}}>
        <input placeholder="Medicine Name *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required style={inp}/>
        <input placeholder="Generic Name" value={form.genericName} onChange={e=>setForm({...form,genericName:e.target.value})} style={inp}/>
        <input placeholder="Batch No" value={form.batchNo} onChange={e=>setForm({...form,batchNo:e.target.value})} style={inp}/>
        <input placeholder="Quantity" type="number" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})} style={inp}/>
        <select value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})} style={inp}>
          <option value="tablet">Tablet</option><option value="capsule">Capsule</option>
          <option value="syrup">Syrup</option><option value="injection">Injection</option><option value="other">Other</option>
        </select>
        <input placeholder="Price" type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} style={inp}/>
        <input placeholder="Expiry Date" type="date" value={form.expiryDate} onChange={e=>setForm({...form,expiryDate:e.target.value})} style={inp}/>
        <input placeholder="Min Stock Alert Level" type="number" value={form.minStock} onChange={e=>setForm({...form,minStock:e.target.value})} style={inp}/>
        <input placeholder="Supplier" value={form.supplier} onChange={e=>setForm({...form,supplier:e.target.value})} style={{...inp,gridColumn:'1/-1'}}/>
        <button type="submit" style={{...btn('#2563eb'),gridColumn:'1/-1',padding:10}}>Add Medicine</button>
      </form>
      <button onClick={()=>setShowHist(!showHist)} style={{...btn('#64748b'),marginBottom:12}}>{showHist?'Hide':'Show'} Dispense History</button>
      {showHist&&history.map(h=>(
        <div key={h._id} style={{...card,fontSize:13}}>
          <b>{h.medicineName}</b> × {h.quantity} → {h.patientName||'—'}
          <span style={{color:'#94a3b8'}}> · {new Date(h.date).toLocaleString()}</span>
        </div>
      ))}
      {list.map(m=>(
        <div key={m._id} style={{...card,borderLeft:m.quantity<=m.minStock?'4px solid #ef4444':'4px solid #e2e8f0'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
            <div>
              <b style={{color:'var(--hms-text)'}}>{m.name}</b>
              <span style={{fontSize:12,color:'#64748b'}}> {m.genericName?`(${m.genericName})`:''} · {m.unit}</span>
              <div style={{fontSize:13,color:m.quantity<=m.minStock?'#ef4444':'#16a34a',fontWeight:600}}>
                Stock: {m.quantity} {m.quantity<=m.minStock&&'⚠️ LOW'}
              </div>
              <div style={{fontSize:12,color:'#94a3b8'}}>Batch: {m.batchNo||'—'} · Exp: {m.expiryDate?new Date(m.expiryDate).toLocaleDateString():'—'} · ৳{m.price}</div>
            </div>
            <div style={{display:'flex',gap:6,alignItems:'center'}}>
              <input type="number" placeholder="Qty" value={qty[m._id]||''} onChange={e=>setQty({...qty,[m._id]:e.target.value})} style={{...inp,width:70}}/>
              <button onClick={()=>dispense(m._id)} style={btn('#7c3aed')}>Dispense</button>
              <button onClick={()=>restock(m._id)} style={btn('#16a34a')}>Restock</button>
              <button onClick={()=>del(m._id)} style={btn('#ef4444')}>✕</button>
            </div>
          </div>
        </div>
      ))}
      {list.length===0&&<div style={{color:'#94a3b8',textAlign:'center',padding:20}}>No medicines yet</div>}
    </div>
  );
}
