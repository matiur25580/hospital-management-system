const fs = require('fs');
const p = 'src/pages/VerifyOtp.jsx';
let s = fs.readFileSync(p, 'utf8');

// 1. done state add
let o1 = "const [err,setErr] = useState(''); const [busy,setBusy] = useState(false);";
let n1 = o1 + " const [done,setDone] = useState(null);";
if (s.includes(o1)) { s = s.replace(o1, n1); console.log('state added'); }

// 2. useEffect guard (success screen ele timer/redirect thambe)
let o2 = "    if(!reg){ nav('/register'); return; }";
let n2 = "    if(done) return;\n    if(!reg){ nav('/register'); return; }";
if (s.includes(o2)) { s = s.replace(o2, n2); console.log('effect guarded'); }
let o2b = "  },[sec]);";
let n2b = "  },[sec, done]);";
if (s.includes(o2b)) { s = s.replace(o2b, n2b); console.log('effect deps updated'); }

// 3. verify(): role pathao + success screen dekhao (auto login-redirect noy)
let o3 = "await axios.post(API + '/api/auth/verify-register', { name: reg.fullName, mobile: reg.contact, email: reg.email, dob: reg.dob, password: reg.password, otp });\n      sessionStorage.removeItem('hms_reg');\n      nav('/login');";
let n3 = "const r = await axios.post(API + '/api/auth/verify-register', { name: reg.fullName, mobile: reg.contact, email: reg.email, dob: reg.dob, password: reg.password, role: reg.role, otp });\n      const info = { uniqueId: r.data.uniqueId, name: reg.fullName, role: reg.role };\n      sessionStorage.removeItem('hms_reg');\n      setDone(info);";
if (s.includes(o3)) { s = s.replace(o3, n3); console.log('verify updated'); }

// 4. success screen render
let o4 = "  const mm = String(Math.floor(sec/60)).padStart(2,'0');";
let n4 = "  if (done) return (\n" +
"    <div style={S.wrap}>\n" +
"      <div style={S.card}>\n" +
"        <div style={S.okIcon}>🎉</div>\n" +
"        <h2 style={S.h}>Successfully Registered!</h2>\n" +
"        <p style={S.sm}>Welcome, <b>{done.name}</b> ({done.role})</p>\n" +
"        <p style={S.sm}>Your Unique ID</p>\n" +
"        <div style={S.idBox}>{done.uniqueId}</div>\n" +
"        <p style={S.note}>⚠️ Please <b>save this ID</b> for future reference. You will need it to login and for all hospital services.</p>\n" +
"        <button onClick={()=>nav('/login')} style={S.btn}>Go to Login →</button>\n" +
"      </div>\n" +
"    </div>\n" +
"  );\n\n" + o4;
if (s.includes(o4)) { s = s.replace(o4, n4); console.log('success screen added'); }

// 5. styles
let o5 = "  link:{background:'none',border:'none',color:'#60a5fa',cursor:'pointer',fontSize:13},";
let n5 = o5 + "\n  okIcon:{fontSize:52,textAlign:'center'},\n" +
"  idBox:{margin:'10px 0',padding:'14px',textAlign:'center',fontSize:26,fontWeight:'bold',letterSpacing:2,background:'#0f172a',border:'2px dashed #38bdf8',borderRadius:10,color:'#38bdf8'},\n" +
"  note:{fontSize:13,marginTop:14,color:'#fde68a',background:'#451a03',padding:10,borderRadius:8,lineHeight:1.5},";
if (s.includes(o5)) { s = s.replace(o5, n5); console.log('styles added'); }

fs.writeFileSync(p, s);
console.log('DONE');
