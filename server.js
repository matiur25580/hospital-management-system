require('dotenv').config();
const express=require('express');
const mongoose=require('mongoose');
const cors=require('cors');
const app=express();
app.use(cors()); app.use(express.json());

mongoose.connect(process.env.MONGO_URI||'mongodb://localhost:27017/hospital')
.then(()=>console.log('MongoDB connected')).catch(e=>console.log(e.message));

app.use('/api/auth',require('./routes/auth'));
app.get('/api/dashboard/stats',async(req,res)=>{
  const Patient=mongoose.models.Patient; const User=require('./models/User');
  res.json({patients:Patient?await Patient.countDocuments():12, doctors:8, appointments:25});
});
app.get('/',(req,res)=>res.send('Hospital API running'));
const PORT=process.env.PORT||5000;
app.listen(PORT,()=>console.log(`Server on ${PORT}`));
