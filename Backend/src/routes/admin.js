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
        id: true, email: true, role: true, createdAt: true,
        patientProfile: { select: { name: true, phone: true } },
        doctorProfile: { select: { name: true, specialty: true, licenseNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/admin/users — create any user type
router.post(
  '/users',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('name').notEmpty(),
    body('role').isIn(['patient', 'doctor', 'admin']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password, name, role, specialty, licenseNumber, bio } = req.body;

    try {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return res.status(409).json({ error: 'Email already registered' });

      const passwordHash = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          role,
          patientProfile: role === 'patient' ? { create: { name } } : undefined,
          doctorProfile: role === 'doctor' ? {
            create: {
              name,
              specialty: specialty || 'General Practice',
              licenseNumber: licenseNumber || 'PENDING',
              bio,
              availability: {
                create: [1, 2, 3, 4, 5].map(day => ({
                  dayOfWeek: day, startTime: '09:00', endTime: '17:00',
                })),
              },
            },
          } : undefined,
          // Store admin display name in a notification record isn't ideal —
          // instead we embed name in the response using the request body
        },
        include: { patientProfile: true, doctorProfile: true },
      });


      res.status(201).json(user);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
);

// PUT /api/admin/users/:id — edit user details
router.put(
  '/users/:id',
  [body('email').optional().isEmail().normalizeEmail()],
  async (req, res) => {
    const { name, email, role } = req.body;
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
        include: { patientProfile: true, doctorProfile: true },
      });
      if (!user) return res.status(404).json({ error: 'User not found' });

      const updated = await prisma.user.update({
        where: { id: req.params.id },
        data: {
          ...(email && { email }),
          ...(role && { role }),
        },
      });

      if (name && user.patientProfile) {
        await prisma.patientProfile.update({ where: { userId: req.params.id }, data: { name } });
      }
      if (name && user.doctorProfile) {
        await prisma.doctorProfile.update({ where: { userId: req.params.id }, data: { name } });
      }

      res.json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }
);

// PUT /api/admin/users/:id/reset-password
router.put(
  '/users/:id/reset-password',
  [body('password').isLength({ min: 8 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const passwordHash = await bcrypt.hash(req.body.password, 12);
      await prisma.user.update({ where: { id: req.params.id }, data: { passwordHash } });
      res.json({ message: 'Password reset successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  }
);

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  if (id === req.user.userId) {
    return res.status(403).json({ error: 'You cannot delete your own admin account' });
  }
  try {
    // Cascade manually — Appointment FK has no onDelete:Cascade in schema
    const apptIds = (await prisma.appointment.findMany({
      where: { OR: [{ patientId: id }, { doctorId: id }] },
      select: { id: true },
    })).map(a => a.id);

    if (apptIds.length) {
      await prisma.consultationNote.deleteMany({ where: { appointmentId: { in: apptIds } } });
      await prisma.appointment.deleteMany({ where: { id: { in: apptIds } } });
    }

    // SymptomSessions, PatientProfile, DoctorProfile, Notifications cascade via schema
    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// PUT /api/admin/users/:id/deactivate (legacy — kept for compatibility)
router.put('/users/:id/deactivate', async (req, res) => {
  try {
    await prisma.user.update({ where: { id: req.params.id }, data: { role: 'patient' } });
    res.json({ message: 'User deactivated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

// POST /api/admin/doctors (legacy — kept for compatibility)
router.post(
  '/doctors',
  [body('email').isEmail().normalizeEmail(), body('password').isLength({ min: 8 }), body('name').notEmpty(), body('specialty').notEmpty(), body('licenseNumber').notEmpty()],
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
          email, passwordHash, role: 'doctor',
          doctorProfile: {
            create: {
              name, specialty, licenseNumber, bio,
              availability: availability
                ? { create: availability }
                : { create: [1, 2, 3, 4, 5].map(d => ({ dayOfWeek: d, startTime: '09:00', endTime: '17:00' })) },
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

    res.json({
      totalUsers, totalDoctors, totalPatients, totalAppointments,
      appointmentsByStatus: Object.fromEntries(statusCounts.map(s => [s.status, s._count])),
      recentAppointments,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// GET /api/admin/knowledge-base (also kept at legacy path)
router.get('/ai-knowledge-base', async (req, res) => {
  try {
    const entries = await prisma.aiKnowledgeBase.findMany({ orderBy: { conditionName: 'asc' } });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch knowledge base' });
  }
});

router.get('/knowledge-base', async (req, res) => {
  try {
    const entries = await prisma.aiKnowledgeBase.findMany({ orderBy: { conditionName: 'asc' } });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch knowledge base' });
  }
});

router.post('/knowledge-base', async (req, res) => {
  const { conditionName, symptomKeywords, specialty } = req.body;
  try {
    const entry = await prisma.aiKnowledgeBase.create({ data: { conditionName, symptomKeywords, specialty } });
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create entry' });
  }
});

router.put('/knowledge-base/:id', async (req, res) => {
  const { conditionName, symptomKeywords, specialty } = req.body;
  try {
    const entry = await prisma.aiKnowledgeBase.update({ where: { id: req.params.id }, data: { conditionName, symptomKeywords, specialty } });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update entry' });
  }
});

router.delete('/knowledge-base/:id', async (req, res) => {
  try {
    await prisma.aiKnowledgeBase.delete({ where: { id: req.params.id } });
    res.json({ message: 'Entry deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

// Legacy routes
router.post('/ai-knowledge-base', async (req, res) => {
  const { conditionName, symptomKeywords, specialty } = req.body;
  try {
    const entry = await prisma.aiKnowledgeBase.create({ data: { conditionName, symptomKeywords, specialty } });
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create entry' });
  }
});
router.put('/ai-knowledge-base/:id', async (req, res) => {
  const { conditionName, symptomKeywords, specialty } = req.body;
  try {
    const entry = await prisma.aiKnowledgeBase.update({ where: { id: req.params.id }, data: { conditionName, symptomKeywords, specialty } });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update entry' });
  }
});
router.delete('/ai-knowledge-base/:id', async (req, res) => {
  try {
    await prisma.aiKnowledgeBase.delete({ where: { id: req.params.id } });
    res.json({ message: 'Entry deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

router.put('/doctors/:id/availability', async (req, res) => {
  const { availability } = req.body;
  if (!Array.isArray(availability)) return res.status(400).json({ error: 'availability must be an array' });
  try {
    await prisma.availability.deleteMany({ where: { doctorId: req.params.id } });
    await prisma.availability.createMany({ data: availability.map(a => ({ ...a, doctorId: req.params.id })) });
    res.json({ message: 'Availability updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

module.exports = router;
