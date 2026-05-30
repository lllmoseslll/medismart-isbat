const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../prisma');
const { requireAuth } = require('../middleware/auth');
const { notifyAppointmentBooked, scheduleNotification } = require('../services/queue');

const router = express.Router();

// GET /api/appointments
router.get('/', requireAuth(), async (req, res) => {
  const { userId, role } = req.user;

  try {
    let where = {};
    if (role === 'patient') where.patientId = userId;
    if (role === 'doctor') where.doctorId = userId;
    // admin sees all

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          include: { patientProfile: { select: { name: true } } },
        },
        doctor: { select: { name: true, specialty: true } },
        session: { select: { symptoms: true, aiResult: true } },
        notes: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });

    res.json(appointments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// POST /api/appointments
router.post(
  '/',
  requireAuth(['patient']),
  [
    body('doctorId').notEmpty(),
    body('scheduledAt').isISO8601(),
    body('sessionId').optional().isUUID(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { doctorId, scheduledAt, sessionId } = req.body;
    const patientId = req.user.userId;

    try {
      const doctor = await prisma.doctorProfile.findUnique({
        where: { userId: doctorId },
        include: { user: { select: { email: true } } },
      });
      if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

      const conflict = await prisma.appointment.findFirst({
        where: {
          doctorId,
          scheduledAt: new Date(scheduledAt),
          status: { notIn: ['cancelled'] },
        },
      });
      if (conflict) return res.status(409).json({ error: 'Slot already booked' });

      const appointment = await prisma.appointment.create({
        data: {
          patientId,
          doctorId,
          sessionId: sessionId || null,
          scheduledAt: new Date(scheduledAt),
          status: 'pending',
        },
      });

      const patient = await prisma.patientProfile.findUnique({ where: { userId: patientId } });
      const patientUser = await prisma.user.findUnique({ where: { id: patientId }, select: { email: true } });

      await notifyAppointmentBooked(
        appointment,
        patient?.name || patientUser?.email || 'Patient',
        patientUser?.email || '',
        doctor.name
      );

      res.status(201).json(appointment);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to book appointment' });
    }
  }
);

// PUT /api/appointments/:id
router.put(
  '/:id',
  requireAuth(['doctor', 'admin', 'patient']),
  [body('status').optional().isIn(['confirmed', 'cancelled', 'completed'])],
  async (req, res) => {
    const { id } = req.params;
    const { status, scheduledAt } = req.body;

    try {
      const appt = await prisma.appointment.findUnique({ where: { id } });
      if (!appt) return res.status(404).json({ error: 'Appointment not found' });

      if (req.user.role === 'patient' && appt.patientId !== req.user.userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      if (req.user.role === 'doctor' && appt.doctorId !== req.user.userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const updated = await prisma.appointment.update({
        where: { id },
        data: {
          ...(status && { status }),
          ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
        },
      });

      if (status === 'cancelled') {
        await scheduleNotification({
          userId: appt.patientId,
          type: 'appointment_cancelled',
          message: `Your appointment on ${new Date(appt.scheduledAt).toLocaleString()} has been cancelled.`,
          channel: 'push',
        });
      }

      res.json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update appointment' });
    }
  }
);

// DELETE /api/appointments/:id
router.delete('/:id', requireAuth(['patient', 'admin']), async (req, res) => {
  const { id } = req.params;

  try {
    const appt = await prisma.appointment.findUnique({ where: { id } });
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });

    if (req.user.role === 'patient' && appt.patientId !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.appointment.update({ where: { id }, data: { status: 'cancelled' } });

    res.json({ message: 'Appointment cancelled' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

module.exports = router;
