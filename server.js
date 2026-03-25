// ===== ROBOK LABS – CONTACT FORM SERVER =====
'use strict';

const path = require('path');

// Load environment variables from .env if present (development only)
try { require('dotenv').config(); } catch (_) { /* dotenv optional in production */ }

const express    = require('express');
const nodemailer = require('nodemailer');
const escapeHtml = require('escape-html');

const app  = express();
const PORT = process.env.PORT || 3000;

// Recipients for all contact-form submissions
const RECIPIENTS = ['info@roboklabs.com', 'instatrades2408@gmail.com'];

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));          // serve HTML/CSS/JS

// ── Nodemailer transport ────────────────────────────────────────────────────
function createTransport() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
    port:   Number(process.env.SMTP_PORT)   || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// ── POST /api/contact ────────────────────────────────────────────────────────
app.post('/api/contact', async (req, res) => {
  const {
    firstName = '', lastName = '', email = '',
    phone = '', company = '', service = '',
    budget = '', message = '',
  } = req.body;

  // Basic validation
  if (!firstName.trim() || !lastName.trim() || !email.trim() || !message.trim()) {
    return res.status(400).json({ ok: false, error: 'Required fields are missing.' });
  }

  // Sanitise subject to prevent email header injection
  const safeName = `${firstName} ${lastName}`.replace(/[\r\n]+/g, ' ').trim();
  const subject  = `New Contact Form Submission from ${safeName}`;

  // HTML-escape all user-supplied values before embedding in the email body
  const e = (v) => escapeHtml(String(v));

  const htmlBody = `
    <h2>New Contact Form Submission – Robok Labs</h2>
    <table style="border-collapse:collapse;width:100%">
      <tr><td style="padding:6px 12px;font-weight:bold">Name</td>
          <td style="padding:6px 12px">${e(firstName)} ${e(lastName)}</td></tr>
      <tr><td style="padding:6px 12px;font-weight:bold">Email</td>
          <td style="padding:6px 12px"><a href="mailto:${e(email)}">${e(email)}</a></td></tr>
      <tr><td style="padding:6px 12px;font-weight:bold">Phone</td>
          <td style="padding:6px 12px">${phone ? e(phone) : '—'}</td></tr>
      <tr><td style="padding:6px 12px;font-weight:bold">Company</td>
          <td style="padding:6px 12px">${company ? e(company) : '—'}</td></tr>
      <tr><td style="padding:6px 12px;font-weight:bold">Service</td>
          <td style="padding:6px 12px">${service ? e(service) : '—'}</td></tr>
      <tr><td style="padding:6px 12px;font-weight:bold">Budget</td>
          <td style="padding:6px 12px">${budget ? e(budget) : '—'}</td></tr>
      <tr><td style="padding:6px 12px;font-weight:bold;vertical-align:top">Message</td>
          <td style="padding:6px 12px;white-space:pre-wrap">${e(message)}</td></tr>
    </table>
  `;

  try {
    const transporter = createTransport();
    await transporter.sendMail({
      from:    `"Robok Labs Website" <${process.env.SMTP_USER}>`,
      to:      RECIPIENTS.join(', '),
      replyTo: email,
      subject,
      html:    htmlBody,
    });

    return res.json({ ok: true, message: 'Your message has been sent successfully.' });
  } catch (err) {
    console.error('Failed to send contact email:', err);
    return res.status(500).json({ ok: false, error: 'Failed to send message. Please try again later.' });
  }
});

// ── Start server ─────────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Robok Labs server listening on http://localhost:${PORT}`);
  });
}

module.exports = { app, RECIPIENTS, createTransport };
