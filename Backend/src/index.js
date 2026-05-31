require('dotenv').config();
const express = require('express');
const cors = require('cors');
const prisma = require('./prisma');
const { startReminderScheduler } = require('./services/queue');

const authRoutes        = require('./routes/auth');
const patientRoutes     = require('./routes/patients');
const appointmentRoutes = require('./routes/appointments');
const doctorRoutes      = require('./routes/doctors');
const adminRoutes       = require('./routes/admin');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.use('/api/auth',         authRoutes);
app.use('/api/patients',     patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/doctors',      doctorRoutes);
app.use('/api/admin',        adminRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, async () => {
  console.log(`MediSmart API running on http://localhost:${PORT}`);
  await autoSeedIfEmpty();
  startReminderScheduler();
});

async function autoSeedIfEmpty() {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log('Empty database detected — running initial seed…');
      const { seed } = require('../prisma/seed');
      await seed();
    }
  } catch (err) {
    console.error('Auto-seed error:', err.message);
  }
}

module.exports = app;
