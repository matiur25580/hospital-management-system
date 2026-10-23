const mongoose=require('mongoose');
const bcrypt=require('bcryptjs');
const s=new mongoose.Schema({
 name:String, email:{type:String,unique:true}, password: String,
  mobile: { type: String },
  dob: { type: String },
 uniqueId: { type: String, unique: true, sparse: true },
 role:{type:String,enum:['Admin','Doctor','Nurse','Receptionist','Patient'],default:'Admin'}
});
s.pre('save',async function(){ if(this.isModified('password')) this.password=await bcrypt.hash(this.password,10); });
s.methods.compare=function(p){ return bcrypt.compare(p,this.password); };
module.exports=mongoose.model('User',s);
