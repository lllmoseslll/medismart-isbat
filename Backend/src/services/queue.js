const { Queue, Worker } = require('bullmq');
const prisma = require('../prisma');
const { sendEmail, appointmentConfirmationHtml, appointmentReminderHtml } = require('./email');

let notificationQueue = null;
let worker = null;

function getRedisConnection() {
  try {
    const IORedis = require('ioredis');
    return new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  } catch {
    return null;
  }
}

function initQueue() {
  const connection = getRedisConnection();
  if (!connection) {
    console.warn('[QUEUE] Redis not available — notifications will be logged only');
    return;
  }

  notificationQueue = new Queue('notifications', { connection });

  worker = new Worker('notifications', async (job) => {
    const { userId, type, message, channel, emailPayload } = job.data;

    await prisma.notification.create({
      data: { userId, type, message, channel: channel || 'email', read: false },
    });

    if (channel === 'email' && emailPayload) {
      await sendEmail(emailPayload);
    }
  }, { connection });

  worker.on('failed', (job, err) => {
    console.error(`[QUEUE] Job ${job?.id} failed:`, err.message);
  });

  console.log('[QUEUE] Notification worker started');
}

async function scheduleNotification(data, delayMs = 0) {
  if (!notificationQueue) {
    console.log(`[NOTIFICATION] ${data.type}: ${data.message}`);
    await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        message: data.message,
        channel: data.channel || 'push',
        read: false,
      },
    }).catch(() => {});
    return;
  }
  await notificationQueue.add('send', data, { delay: delayMs });
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
    await scheduleNotification({
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

module.exports = { initQueue, scheduleNotification, notifyAppointmentBooked };
