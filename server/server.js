const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
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
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static('uploads'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
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

app.use("/api/prescriptions", require("./routes/prescriptions"));
app.use("/api/lab-reports", require("./routes/labreports"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/vitals", require("./routes/vitals"));
app.use("/api/cases", require("./routes/cases"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/schedules", require("./routes/schedules"));
app.use("/api/analytics", require("./routes/analytics"));
app.use("/api/pharmacy", require("./routes/pharmacy"));
app.use("/api/ambulance", require("./routes/ambulance"));
app.use("/api/attendance", require("./routes/attendance"));
app.use("/api/departments", require("./routes/departments"));
app.use("/api/roster", require("./routes/roster"));
app.use("/api/ot", require("./routes/ot"));
app.use("/api/bloodbank", require("./routes/bloodbank"));
app.use("/api/discharge", require("./routes/discharge"));
app.use("/api/staff", require("./routes/staff"));
app.use("/api/hr", require("./routes/hr"));
app.use("/api/gatepass", require("./routes/gatepass"));
app.use("/api/inventory", require("./routes/inventory"));
app.use("/api/ppe", require("./routes/ppe"));
app.use("/api/cleaning", require("./routes/cleaning"));
app.use("/api/notices", require("./routes/notices"));
app.use("/api/feedback", require("./routes/feedback"));
app.use("/api/tele", require("./routes/tele"));
app.use("/api/insurance", require("./routes/insurance"));
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
