require('dotenv').config();

const express = require('express');
const path = require('path');
const app = express();
const sendEmail = require('./mailer');

const COMPANY_NAME = process.env.COMPANY_NAME || 'pickuplay';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || process.env.GMAIL_USER || 'support@pickuplay.com';
const OTP_EXPIRY_MINUTES = process.env.OTP_EXPIRY_MINUTES ? Number(process.env.OTP_EXPIRY_MINUTES) : 10;

function buildOtpEmail(otp) {
  const subject = `Pickuplay — Your One-Time Verification Code`;

  const html = `
    <div style="font-family: Arial, sans-serif; color:#111; line-height:1.4;">
      <h2 style="margin:0 0 8px 0;">Pickuplay — Verification Code</h2>
      <p style="margin:0 0 12px 0;">Use the code below to complete your action. It expires in <strong>10 minute(s)</strong>.</p>
      <div style="display:inline-block; padding:12px 18px; background:#f5f7fb; border-radius:6px; font-size:20px; letter-spacing:4px; margin:8px 0;">
        <strong>${otp}</strong>
      </div>
      <p style="color:#666; font-size:13px; margin-top:12px;">
        If you did not request this code, ignore this email or contact <a href="mailto:your-email@gmail.com">your-email@gmail.com</a>.
      </p>
      <hr style="border:none; border-top:1px solid #eee; margin:18px 0;">
      <small style="color:#999">This message was sent by Pickuplay. Please do not reply to this automated email.</small>
    </div>
  `;

  return { subject, html };
}
app.use(express.json()); // added: parse JSON bodies

app.get(['/', '/index'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/privacy-policy', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'privacy-policy.html'));
});
app.get('/terms-and-coditions', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'terms-and-coditions.html'));
});

// debug request logger
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.url, 'body:', req.body);
  next();
});

// added: endpoint to receive an OTP and send it by email
app.post('/send-otp', async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) {
      return res.status(400).json({ error: 'email and otp are required' });
    }
    if (typeof otp !== 'string' && typeof otp !== 'number') {
      return res.status(400).json({ error: 'otp must be a string or number' });
    }
    const otpStr = String(otp).trim();
    if (otpStr.length < 3 || otpStr.length > 12) {
      return res.status(400).json({ error: 'otp length invalid' });
    }

    const { subject, html } = buildOtpEmail(otpStr);

    console.log('sendEmail declared params:', sendEmail.length, 'calling with (to, subject, {text, html})');

    // try common signatures: (to, subject, {text, html}) OR (to, subject, text)
    try {
      await sendEmail(email, subject, html );
    } catch (err1) {
      console.warn('first sendEmail call failed, trying fallback signature:', err1 && err1.message);

      return res.status(502).json({ error: 'send_failed', message: err1.message});
    }

    return res.json({ ok: true, message: 'OTP sent' });
  } catch (err) {
    console.error('Send OTP unexpected error:', err.stack || err);
    return res.status(500).json({ error: 'send_failed', message: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
