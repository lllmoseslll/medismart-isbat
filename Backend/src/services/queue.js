const prisma = require('../prisma');
const { sendEmail, appointmentConfirmationHtml, appointmentReminderHtml } = require('./email');

async function recordAndSend(data) {
  try {
    await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        message: data.message,
        channel: data.channel || 'push',
        read: false,
      },
    });
  } catch (err) {
    console.error('[NOTIFICATION] DB write failed:', err.message);
  }

  if (data.channel === 'email' && data.emailPayload) {
    try {
      await sendEmail(data.emailPayload);
    } catch (err) {
      console.error('[NOTIFICATION] Email send failed:', err.message);
    }
  }
}

async function scheduleNotification(data, delayMs = 0) {
  if (delayMs > 0) {
    setTimeout(() => recordAndSend(data), delayMs);
  } else {
    await recordAndSend(data);
  }
}

async function notifyAppointmentBooked(appointment, patientName, patientEmail, doctorName) {
  await scheduleNotification({
    userId: appointment.patientId,
    type: 'appointment_confirmed',
    message: `Your appointment with ${doctorName} is confirmed for ${new Date(appointment.scheduledAt).toLocaleString()}.`,
    channel: 'email',
    emailPayload: {
      to: patientEmail,
      subject: 'Appointment Confirmed — MediSmart',
      html: appointmentConfirmationHtml(patientName, doctorName, appointment.scheduledAt),
    },
  });

  const msUntil24hBefore = new Date(appointment.scheduledAt) - Date.now() - 24 * 60 * 60 * 1000;
  if (msUntil24hBefore > 0) {
    scheduleNotification({
      userId: appointment.patientId,
      type: 'appointment_reminder',
      message: `Reminder: appointment with ${doctorName} tomorrow at ${new Date(appointment.scheduledAt).toLocaleTimeString()}.`,
      channel: 'email',
      emailPayload: {
        to: patientEmail,
        subject: 'Appointment Reminder — MediSmart',
        html: appointmentReminderHtml(patientName, doctorName, appointment.scheduledAt),
      },
    }, msUntil24hBefore);
  }
}

module.exports = { scheduleNotification, notifyAppointmentBooked };
