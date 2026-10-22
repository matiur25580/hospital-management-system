const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.CLIENT_URL || "*" } });

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 50, standardHeaders: true }));

app.get('/api/health', (req,res)=> res.json({status:'Hospital API running'}));
app.use('/api/auth', require('./routes/otpAuth'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/beds', require('./routes/beds'));
app.use('/api/doctors', require('./routes/doctors'));

io.on('connection', (socket)=>{
  console.log('Client connected:', socket.id);
  socket.on('disconnect', ()=> console.log('Client disconnected'));
});

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hospital')
.then(()=> {
  console.log('MongoDB connected');
  server.listen(PORT, ()=> console.log('Server running on port '+PORT));
})
.catch(err=> console.error(err));
