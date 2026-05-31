const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../prisma');
const { requireAuth } = require('../middleware/auth');
const { analyzeSymptoms } = require('../services/ai');

const router = express.Router();

// GET /api/patients/:id/profile
router.get('/:id/profile', requireAuth(['patient', 'doctor', 'admin']), async (req, res) => {
  const { id } = req.params;
  if (req.user.role === 'patient' && req.user.userId !== id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const profile = await prisma.patientProfile.findUnique({
      where: { userId: id },
      include: { user: { select: { email: true, createdAt: true } } },
    });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /api/patients/:id/profile
router.put(
  '/:id/profile',
  requireAuth(['patient', 'admin']),
  [
    body('name').optional().notEmpty(),
    body('phone').optional().isString().trim(),
    body('gender').optional().isIn(['male', 'female', 'other', 'prefer_not_to_say']),
    body('dob').optional().isISO8601(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { id } = req.params;
    if (req.user.role === 'patient' && req.user.userId !== id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { name, phone, gender, dob, medicalHistory } = req.body;

    try {
      const profile = await prisma.patientProfile.upsert({
        where: { userId: id },
        update: {
          ...(name && { name }),
          ...(phone && { phone }),
          ...(gender && { gender }),
          ...(dob && { dob: new Date(dob) }),
          ...(medicalHistory && { medicalHistory }),
        },
        create: {
          userId: id,
          name: name || '',
          phone,
          gender,
          dob: dob ? new Date(dob) : undefined,
          medicalHistory,
        },
      });
      res.json(profile);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

// POST /api/symptoms
router.post(
  '/symptoms',
  requireAuth(['patient']),
  [body('symptoms').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { symptoms } = req.body;

    try {
      const aiResult = await analyzeSymptoms(symptoms);

      const session = await prisma.symptomSession.create({
        data: {
          patientId: req.user.userId,
          symptoms: Array.isArray(symptoms) ? symptoms : [symptoms],
          aiResult,
        },
      });

      res.status(201).json({ session, aiResult });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Symptom analysis failed' });
    }
  }
);

// GET /api/patients/symptoms/:sessionId
router.get('/symptoms/:sessionId', requireAuth(['patient', 'doctor', 'admin']), async (req, res) => {
  try {
    const session = await prisma.symptomSession.findUnique({
      where: { id: req.params.sessionId },
    });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    if (req.user.role === 'patient' && session.patientId !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// GET /api/patients/symptoms — list patient's own sessions
router.get('/symptoms', requireAuth(['patient']), async (req, res) => {
  try {
    const sessions = await prisma.symptomSession.findMany({
      where: { patientId: req.user.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

module.exports = router;
