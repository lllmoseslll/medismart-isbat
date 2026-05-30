require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const appointmentRoutes = require('./routes/appointments');
const doctorRoutes = require('./routes/doctors');
const adminRoutes = require('./routes/admin');
const { initQueue } = require('./services/queue');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

initQueue();

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`MediSmart API running on http://localhost:${PORT}`);
});

module.exports = app;
