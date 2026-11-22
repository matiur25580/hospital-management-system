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
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS.'));
  },
};

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
// Do not expose clinical attachments through a public static directory.
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
}));

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'Hospital API running' });
});

app.use('/api/auth', require('./routes/otpAuth'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/beds', require('./routes/beds'));
app.use('/api/doctors', require('./routes/doctors'));

io.on('connection', (socket) => {
  console.log('Realtime client connected:', socket.id);
  socket.on('disconnect', () => console.log('Realtime client disconnected:', socket.id));
});

app.use('/api/prescriptions', require('./routes/prescriptions'));
app.use('/api/lab-reports', require('./routes/labreports'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/vitals', require('./routes/vitals'));
app.use('/api/cases', require('./routes/cases'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/pharmacy', require('./routes/pharmacy'));
app.use('/api/ambulance', require('./routes/ambulance'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/roster', require('./routes/roster'));
app.use('/api/ot', require('./routes/ot'));
app.use('/api/bloodbank', require('./routes/bloodbank'));
app.use('/api/discharge', require('./routes/discharge'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/hr', require('./routes/hr'));
app.use('/api/gatepass', require('./routes/gatepass'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/ppe', require('./routes/ppe'));
app.use('/api/cleaning', require('./routes/cleaning'));
app.use('/api/notices', require('./routes/notices'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/tele', require('./routes/tele'));
app.use('/api/insurance', require('./routes/insurance'));

app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));

app.use((err, _req, res, _next) => {
  if (err.message === 'Origin is not allowed by CORS.') return res.status(403).json({ message: 'Origin is not allowed.' });
  if (err instanceof SyntaxError && err.status === 400) return res.status(400).json({ message: 'Invalid JSON request body.' });
  if (err.status === 413) return res.status(413).json({ message: 'Request body is too large.' });
  console.error('API error:', err.message);
  return res.status(err.status || 500).json({ message: err.status && err.status < 500 ? err.message : 'Internal server error' });
});

const PORT = Number(process.env.PORT) || 5000;
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('MONGO_URI is required. Configure it in server/.env.');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  });
