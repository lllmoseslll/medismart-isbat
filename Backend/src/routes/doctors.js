const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../prisma');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/doctors/knowledge-base — doctors can view + contribute
router.get('/knowledge-base', requireAuth(['doctor', 'admin']), async (req, res) => {
  try {
    const entries = await prisma.aiKnowledgeBase.findMany({ orderBy: { conditionName: 'asc' } });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch knowledge base' });
  }
});

// POST /api/doctors/knowledge-base — doctors submit new entries
router.post('/knowledge-base', requireAuth(['doctor', 'admin']), async (req, res) => {
  const { conditionName, symptomKeywords, specialty } = req.body;
  if (!conditionName || !symptomKeywords) {
    return res.status(400).json({ error: 'conditionName and symptomKeywords are required' });
  }
  try {
    const entry = await prisma.aiKnowledgeBase.create({
      data: {
        conditionName,
        symptomKeywords: Array.isArray(symptomKeywords) ? symptomKeywords : symptomKeywords.split(',').map(s => s.trim()).filter(Boolean),
        specialty: specialty || 'General Practice',
      },
    });
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create entry' });
  }
});

// GET /api/doctors/me/appointments (doctor's own view)
router.get('/me/appointments', requireAuth(['doctor']), async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { doctorId: req.user.userId },
      include: { patient: { include: { patientProfile: true } }, session: true, notes: true },
      orderBy: { scheduledAt: 'asc' },
    });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// GET /api/doctors?specialty=&date=
router.get('/', requireAuth(), async (req, res) => {
  const { specialty, date } = req.query;

  try {
    const doctors = await prisma.doctorProfile.findMany({
      where: specialty ? { specialty } : undefined,
      include: {
        availability: true,
        user: { select: { email: true } },
      },
    });

    // Add patient count per doctor
    const withCounts = await Promise.all(doctors.map(async d => {
      const uniquePatients = await prisma.appointment.groupBy({
        by: ['patientId'],
        where: { doctorId: d.userId, status: { not: 'cancelled' } },
      });
      return { ...d, patientCount: uniquePatients.length };
    }));

    if (date) {
      const day = new Date(date).getDay();
      return res.json(withCounts.filter(d => d.availability.some(a => a.dayOfWeek === day)));
    }

    res.json(withCounts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

// GET /api/doctors/:id/availability
router.get('/:id/availability', requireAuth(), async (req, res) => {
  try {
    const availability = await prisma.availability.findMany({
      where: { doctorId: req.params.id },
      orderBy: { dayOfWeek: 'asc' },
    });
    const bookedSlots = await prisma.appointment.findMany({
      where: { doctorId: req.params.id, status: { notIn: ['cancelled'] }, scheduledAt: { gte: new Date() } },
      select: { scheduledAt: true },
    });
    res.json({ availability, bookedSlots: bookedSlots.map(a => a.scheduledAt) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// POST /api/doctors/:id/notes
router.post(
  '/:id/notes',
  requireAuth(['doctor']),
  [body('appointmentId').notEmpty(), body('notes').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    if (req.params.id !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });

    const { appointmentId, notes, diagnosis, treatment } = req.body;
    try {
      const appt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
      if (!appt || appt.doctorId !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });

      const note = await prisma.consultationNote.create({
        data: { appointmentId, doctorId: req.user.userId, notes, diagnosis, treatment },
      });
      await prisma.appointment.update({ where: { id: appointmentId }, data: { status: 'completed' } });
      res.status(201).json(note);
    } catch (err) {
      res.status(500).json({ error: 'Failed to save notes' });
    }
  }
);

// GET /api/doctors/:id/notes/:apptId
router.get('/:id/notes/:apptId', requireAuth(['doctor', 'admin']), async (req, res) => {
  try {
    const notes = await prisma.consultationNote.findMany({ where: { appointmentId: req.params.apptId } });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

module.exports = router;
