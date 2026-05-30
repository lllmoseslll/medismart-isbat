const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmail({ to, subject, html }) {
  if (!process.env.SMTP_USER) {
    console.log(`[EMAIL SKIPPED] To: ${to} | Subject: ${subject}`);
    return;
  }
  return transporter.sendMail({
    from: `"MediSmart" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}

function appointmentConfirmationHtml(patient, doctor, scheduledAt) {
  return `
    <h2>Appointment Confirmed</h2>
    <p>Dear ${patient},</p>
    <p>Your appointment with <strong>${doctor}</strong> is confirmed for <strong>${new Date(scheduledAt).toLocaleString()}</strong>.</p>
    <p>Please arrive 10 minutes early.</p>
    <p>— MediSmart Team</p>
  `;
}

function appointmentReminderHtml(patient, doctor, scheduledAt) {
  return `
    <h2>Appointment Reminder</h2>
    <p>Dear ${patient},</p>
    <p>This is a reminder that your appointment with <strong>${doctor}</strong> is scheduled for <strong>${new Date(scheduledAt).toLocaleString()}</strong>.</p>
    <p>— MediSmart Team</p>
  `;
}

module.exports = { sendEmail, appointmentConfirmationHtml, appointmentReminderHtml };
