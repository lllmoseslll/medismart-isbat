const prisma = require('../prisma');
const {
  sendEmail,
  appointmentConfirmationHtml,
  appointmentReminderHtml,
  appointmentStatusChangedHtml,
  newBookingDoctorHtml,
} = require('./email');

// ─── core helper ─────────────────────────────────────────
async function recordAndSend(data) {
  try {
    await prisma.notification.create({
      data: {
        userId:  data.userId,
        type:    data.type,
        message: data.message,
        channel: data.channel || 'push',
        read:    false,
      },
    });
  } catch (err) {
    console.error('[NOTIFICATION] DB write failed:', err.message);
  }

  if (data.emailPayload) {
    await sendEmail(data.emailPayload);
  }
}

async function scheduleNotification(data, delayMs = 0) {
  if (delayMs > 0) {
    setTimeout(() => recordAndSend(data), delayMs);
  } else {
    await recordAndSend(data);
  }
}

// ─── booking: notify patient + doctor ────────────────────
async function notifyAppointmentBooked(appointment, patientName, patientEmail, doctorName, doctorEmail, specialty, symptoms) {
  // 1. Confirmation to patient
  await scheduleNotification({
    userId:  appointment.patientId,
    type:    'appointment_confirmed',
    message: `Your appointment with ${doctorName} is booked for ${new Date(appointment.scheduledAt).toLocaleString()}.`,
    channel: 'email',
    emailPayload: {
      to:      patientEmail,
      subject: `Appointment Confirmed — ${doctorName} | MediSmart`,
      html:    appointmentConfirmationHtml(patientName, doctorName, appointment.scheduledAt, specialty),
    },
  });

  // 2. New-booking alert to doctor
  if (doctorEmail) {
    await scheduleNotification({
      userId:  appointment.doctorId,
      type:    'new_appointment_request',
      message: `New appointment request from ${patientName} on ${new Date(appointment.scheduledAt).toLocaleString()}.`,
      channel: 'email',
      emailPayload: {
        to:      doctorEmail,
        subject: `New Appointment Request — ${patientName} | MediSmart`,
        html:    newBookingDoctorHtml(doctorName, patientName, patientEmail, appointment.scheduledAt, symptoms),
      },
    });
  }
}

// ─── status change: notify patient ───────────────────────
async function notifyStatusChange(appointment, patientName, patientEmail, doctorName, newStatus) {
  const typeMap = { confirmed: 'appointment_confirmed', cancelled: 'appointment_cancelled', completed: 'appointment_completed' };
  await scheduleNotification({
    userId:  appointment.patientId,
    type:    typeMap[newStatus] || 'appointment_update',
    message: `Your appointment with ${doctorName} on ${new Date(appointment.scheduledAt).toLocaleDateString()} has been ${newStatus}.`,
    channel: 'email',
    emailPayload: {
      to:      patientEmail,
      subject: `Appointment ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)} — MediSmart`,
      html:    appointmentStatusChangedHtml(patientName, doctorName, appointment.scheduledAt, newStatus),
    },
  });
}

// ─── 24h reminder cron ───────────────────────────────────
// Runs every hour, finds appointments in the 23h–25h window, sends reminder
// if not already sent.
async function runReminderCheck() {
  const now     = Date.now();
  const from    = new Date(now + 23 * 3600 * 1000);
  const to      = new Date(now + 25 * 3600 * 1000);

  let upcoming;
  try {
    upcoming = await prisma.appointment.findMany({
      where: { scheduledAt: { gte: from, lte: to }, status: { in: ['confirmed', 'pending'] } },
      include: {
        patient: { select: { email: true, patientProfile: { select: { name: true } } } },
        doctor:  { select: { name: true, specialty: true } },
      },
    });
  } catch {
    return; // DB not ready yet on startup
  }

  for (const appt of upcoming) {
    const alreadySent = await prisma.notification.findFirst({
      where: { userId: appt.patientId, type: 'appointment_reminder', message: { contains: appt.id } },
    });
    if (alreadySent) continue;

    const patientName  = appt.patient.patientProfile?.name || appt.patient.email;
    const patientEmail = appt.patient.email;
    const doctorName   = appt.doctor.name;
    const specialty    = appt.doctor.specialty;

    await scheduleNotification({
      userId:  appt.patientId,
      type:    'appointment_reminder',
      message: `Reminder [${appt.id}]: appointment with ${doctorName} on ${new Date(appt.scheduledAt).toLocaleString()}.`,
      channel: 'email',
      emailPayload: {
        to:      patientEmail,
        subject: `Appointment Reminder — Tomorrow with ${doctorName} | MediSmart`,
        html:    appointmentReminderHtml(patientName, doctorName, appt.scheduledAt, specialty),
      },
    });

    console.log(`[REMINDER] Sent to ${patientEmail} for appointment ${appt.id}`);
  }
}

function startReminderScheduler() {
  // Run 5 seconds after startup, then every hour
  setTimeout(runReminderCheck, 5000);
  setInterval(runReminderCheck, 3600 * 1000);
  console.log('[REMINDERS] Scheduler started — checks every hour');
}

module.exports = { scheduleNotification, notifyAppointmentBooked, notifyStatusChange, startReminderScheduler };
