const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const prisma = require('../prisma');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth(['admin']));

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        patientProfile: { select: { name: true } },
        doctorProfile: { select: { name: true, specialty: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/admin/doctors
router.post(
  '/doctors',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('name').notEmpty(),
    body('specialty').notEmpty(),
    body('licenseNumber').notEmpty(),
    body('bio').optional(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password, name, specialty, licenseNumber, bio, availability } = req.body;

    try {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return res.status(409).json({ error: 'Email already registered' });

      const passwordHash = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          role: 'doctor',
          doctorProfile: {
            create: {
              name,
              specialty,
              licenseNumber,
              bio,
              availability: availability
                ? { create: availability }
                : {
                    create: [1, 2, 3, 4, 5].map(day => ({
                      dayOfWeek: day,
                      startTime: '09:00',
                      endTime: '17:00',
                    })),
                  },
            },
          },
        },
        include: { doctorProfile: true },
      });

      res.status(201).json(user);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create doctor' });
    }
  }
);

// PUT /api/admin/users/:id/deactivate
router.put('/users/:id/deactivate', async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role: 'patient' },
    });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

// GET /api/admin/reports
router.get('/reports', async (req, res) => {
  try {
    const [totalUsers, totalDoctors, totalPatients, totalAppointments, statusCounts, recentAppointments] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: 'doctor' } }),
        prisma.user.count({ where: { role: 'patient' } }),
        prisma.appointment.count(),
        prisma.appointment.groupBy({ by: ['status'], _count: true }),
        prisma.appointment.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            patient: { include: { patientProfile: { select: { name: true } } } },
            doctor: { select: { name: true, specialty: true } },
          },
        }),
      ]);

    const appointmentsByStatus = Object.fromEntries(
      statusCounts.map(s => [s.status, s._count])
    );

    res.json({
      totalUsers,
      totalDoctors,
      totalPatients,
      totalAppointments,
      appointmentsByStatus,
      recentAppointments,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// GET /api/admin/ai-knowledge-base
router.get('/ai-knowledge-base', async (req, res) => {
  try {
    const entries = await prisma.aiKnowledgeBase.findMany({
      orderBy: { conditionName: 'asc' },
    });
    res.json(entries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch knowledge base' });
  }
});

// PUT /api/admin/ai-model
router.put('/ai-model', async (req, res) => {
  const { entries } = req.body;
  if (!Array.isArray(entries)) return res.status(400).json({ error: 'entries must be an array' });

  try {
    await prisma.aiKnowledgeBase.deleteMany();
    await prisma.aiKnowledgeBase.createMany({ data: entries });
    res.json({ message: 'Knowledge base updated', count: entries.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update AI model' });
  }
});

// PUT /api/admin/ai-knowledge-base/:id
router.put('/ai-knowledge-base/:id', async (req, res) => {
  const { conditionName, symptomKeywords, specialty } = req.body;
  try {
    const entry = await prisma.aiKnowledgeBase.update({
      where: { id: req.params.id },
      data: { conditionName, symptomKeywords, specialty },
    });
    res.json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update entry' });
  }
});

// DELETE /api/admin/ai-knowledge-base/:id
router.delete('/ai-knowledge-base/:id', async (req, res) => {
  try {
    await prisma.aiKnowledgeBase.delete({ where: { id: req.params.id } });
    res.json({ message: 'Entry deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

// POST /api/admin/ai-knowledge-base
router.post('/ai-knowledge-base', async (req, res) => {
  const { conditionName, symptomKeywords, specialty } = req.body;
  try {
    const entry = await prisma.aiKnowledgeBase.create({
      data: { conditionName, symptomKeywords, specialty },
    });
    res.status(201).json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create entry' });
  }
});

// PUT /api/admin/doctors/:id/availability
router.put('/doctors/:id/availability', async (req, res) => {
  const { availability } = req.body;
  if (!Array.isArray(availability)) return res.status(400).json({ error: 'availability must be an array' });

  try {
    await prisma.availability.deleteMany({ where: { doctorId: req.params.id } });
    await prisma.availability.createMany({
      data: availability.map(a => ({ ...a, doctorId: req.params.id })),
    });
    res.json({ message: 'Availability updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

module.exports = router;
