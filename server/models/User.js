const mongoose=require('mongoose');
const bcrypt=require('bcryptjs');
const s=new mongoose.Schema({
 name:String, email:{type:String,unique:true}, password: { type: String, minlength: 12, validate: { validator: (value) => Buffer.byteLength(value || '', 'utf8') <= 72, message: 'Password must not exceed 72 UTF-8 bytes' } },
  mobile: { type: String },
  dob: { type: String },
 uniqueId: { type: String, unique: true, sparse: true },
 role:{type:String,enum:['Admin','Doctor','Nurse','Receptionist','Patient'],default:'Patient'}
});
s.pre('save',async function(){ if(this.isModified('password')) this.password=await bcrypt.hash(this.password,10); });
s.methods.compare=function(p){ return bcrypt.compare(p,this.password); };
module.exports=mongoose.model('User',s);
