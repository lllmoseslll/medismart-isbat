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
    console.log(`[EMAIL SKIPPED – no SMTP_USER] To: ${to} | ${subject}`);
    return;
  }
  try {
    await transporter.sendMail({
      from: `"MediSmart" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[EMAIL SENT] To: ${to} | ${subject}`);
  } catch (err) {
    console.error(`[EMAIL ERROR] To: ${to} | ${err.message}`);
  }
}

// ─── shared layout ───────────────────────────────────────
function wrap(accentColor, iconEmoji, title, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e2e8f0;">

          <!-- Header -->
          <tr>
            <td style="background:${accentColor};padding:28px 36px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:28px;padding-right:10px;">${iconEmoji}</td>
                  <td>
                    <div style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">MediSmart</div>
                    <div style="color:rgba(255,255,255,0.75);font-size:12px;margin-top:2px;">AI-Powered Healthcare Platform</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 36px;">
              <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
                This email was sent by MediSmart. If you have questions, contact your clinic directly.<br/>
                © ${new Date().getFullYear()} MediSmart. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function badge(color, text) {
  const bg = { green: '#d1fae5', teal: '#ccfbf1', amber: '#fef3c7', red: '#fee2e2', blue: '#dbeafe' };
  const fg = { green: '#065f46', teal: '#0f766e', amber: '#92400e', red: '#991b1b', blue: '#1e40af' };
  return `<span style="display:inline-block;background:${bg[color]||bg.teal};color:${fg[color]||fg.teal};font-size:11px;font-weight:700;padding:3px 10px;text-transform:uppercase;letter-spacing:0.5px;">${text}</span>`;
}

function infoRow(label, value) {
  return `<tr>
    <td style="padding:8px 0;color:#64748b;font-size:13px;width:140px;">${label}</td>
    <td style="padding:8px 0;color:#0f172a;font-size:13px;font-weight:600;">${value}</td>
  </tr>`;
}

function btn(href, text, color = '#0d9488') {
  return `<a href="${href}" style="display:inline-block;background:${color};color:#ffffff;font-weight:700;font-size:14px;padding:12px 28px;text-decoration:none;margin-top:24px;">${text}</a>`;
}

// ─── email builders ───────────────────────────────────────

function appointmentConfirmationHtml(patientName, doctorName, scheduledAt, specialty) {
  const dateStr = new Date(scheduledAt).toLocaleString('en-UG', { weekday:'long', year:'numeric', month:'long', day:'numeric', hour:'numeric', minute:'2-digit' });
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;color:#0f172a;">Appointment Confirmed ✓</h2>
    <p style="margin:0 0 24px;color:#475569;font-size:15px;">Dear <strong>${patientName}</strong>, your appointment has been successfully booked.</p>
    <table cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;width:100%;margin-bottom:8px;">
      <tr><td style="padding:20px;">
        <table cellpadding="0" cellspacing="0" width="100%">
          ${infoRow('Doctor', doctorName)}
          ${specialty ? infoRow('Specialty', specialty) : ''}
          ${infoRow('Date & time', dateStr)}
          ${infoRow('Status', badge('teal', 'Confirmed'))}
        </table>
      </td></tr>
    </table>
    <p style="margin:20px 0 0;font-size:13px;color:#64748b;">Please arrive <strong>10 minutes early</strong>. Bring any relevant medical records or previous test results.</p>
    <p style="margin:24px 0 0;color:#0f172a;font-size:14px;">If you need to cancel or reschedule, please do so at least 24 hours in advance.</p>
  `;
  return wrap('#0d9488', '🏥', 'Appointment Confirmed — MediSmart', body);
}

function appointmentReminderHtml(patientName, doctorName, scheduledAt, specialty) {
  const dateStr = new Date(scheduledAt).toLocaleString('en-UG', { weekday:'long', year:'numeric', month:'long', day:'numeric', hour:'numeric', minute:'2-digit' });
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;color:#0f172a;">Appointment Reminder 📅</h2>
    <p style="margin:0 0 24px;color:#475569;font-size:15px;">Dear <strong>${patientName}</strong>, this is a reminder about your upcoming appointment.</p>
    <table cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;width:100%;margin-bottom:8px;">
      <tr><td style="padding:20px;">
        <table cellpadding="0" cellspacing="0" width="100%">
          ${infoRow('Doctor', doctorName)}
          ${specialty ? infoRow('Specialty', specialty) : ''}
          ${infoRow('Date & time', dateStr)}
          ${infoRow('', badge('amber', 'Tomorrow'))}
        </table>
      </td></tr>
    </table>
    <p style="margin:20px 0 0;font-size:13px;color:#64748b;">Remember to arrive <strong>10 minutes early</strong> and bring any relevant documents.</p>
  `;
  return wrap('#f59e0b', '⏰', 'Appointment Reminder — MediSmart', body);
}

function appointmentStatusChangedHtml(patientName, doctorName, scheduledAt, newStatus) {
  const dateStr = new Date(scheduledAt).toLocaleString('en-UG', { weekday:'long', year:'numeric', month:'long', day:'numeric', hour:'numeric', minute:'2-digit' });
  const configs = {
    confirmed:  { accent: '#0d9488', icon: '✅', title: 'Appointment Confirmed',  badge: badge('teal',  'Confirmed'),  msg: 'Your appointment has been confirmed by the doctor. We look forward to seeing you.' },
    cancelled:  { accent: '#ef4444', icon: '❌', title: 'Appointment Cancelled',   badge: badge('red',   'Cancelled'),   msg: 'Your appointment has been cancelled. Please book a new appointment at your convenience.' },
    completed:  { accent: '#3b82f6', icon: '🩺', title: 'Consultation Completed', badge: badge('blue',  'Completed'),  msg: 'Your consultation is complete. Your doctor may have left notes — log in to review them.' },
  };
  const cfg = configs[newStatus] || configs.confirmed;
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;color:#0f172a;">${cfg.icon} ${cfg.title}</h2>
    <p style="margin:0 0 24px;color:#475569;font-size:15px;">Dear <strong>${patientName}</strong>, your appointment status has been updated.</p>
    <table cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;width:100%;margin-bottom:8px;">
      <tr><td style="padding:20px;">
        <table cellpadding="0" cellspacing="0" width="100%">
          ${infoRow('Doctor', doctorName)}
          ${infoRow('Date & time', dateStr)}
          ${infoRow('Status', cfg.badge)}
        </table>
      </td></tr>
    </table>
    <p style="margin:20px 0 0;font-size:14px;color:#475569;">${cfg.msg}</p>
  `;
  return wrap(cfg.accent, '🏥', `${cfg.title} — MediSmart`, body);
}

function newBookingDoctorHtml(doctorName, patientName, patientEmail, scheduledAt, symptoms) {
  const dateStr = new Date(scheduledAt).toLocaleString('en-UG', { weekday:'long', year:'numeric', month:'long', day:'numeric', hour:'numeric', minute:'2-digit' });
  const symptomList = symptoms && symptoms.length
    ? `<p style="margin:16px 0 4px;font-size:13px;color:#64748b;font-weight:600;">REPORTED SYMPTOMS</p>
       <p style="margin:0;font-size:13px;color:#334155;">${Array.isArray(symptoms) ? symptoms.join(', ') : symptoms}</p>`
    : '';
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;color:#0f172a;">New Appointment Request 📋</h2>
    <p style="margin:0 0 24px;color:#475569;font-size:15px;">Dear Dr. <strong>${doctorName}</strong>, a patient has booked an appointment with you.</p>
    <table cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;width:100%;margin-bottom:8px;">
      <tr><td style="padding:20px;">
        <table cellpadding="0" cellspacing="0" width="100%">
          ${infoRow('Patient', patientName)}
          ${infoRow('Email', patientEmail)}
          ${infoRow('Date & time', dateStr)}
          ${infoRow('Status', badge('amber', 'Pending — action required'))}
        </table>
        ${symptomList}
      </td></tr>
    </table>
    <p style="margin:20px 0 0;font-size:14px;color:#475569;">Please log in to confirm or decline this appointment.</p>
  `;
  return wrap('#0284c7', '👨‍⚕️', 'New Appointment Request — MediSmart', body);
}

module.exports = {
  sendEmail,
  appointmentConfirmationHtml,
  appointmentReminderHtml,
  appointmentStatusChangedHtml,
  newBookingDoctorHtml,
};
