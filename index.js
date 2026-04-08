// ...existing code...
require('dotenv').config();

const express = require('express');
const app = express();
const sendEmail = require('./mailer');

const COMPANY_NAME = process.env.COMPANY_NAME || 'pickuplay';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || process.env.GMAIL_USER || 'support@pickuplay.com';
const OTP_EXPIRY_MINUTES = process.env.OTP_EXPIRY_MINUTES ? Number(process.env.OTP_EXPIRY_MINUTES) : 10;

function buildOtpEmail(otp, expiresInMinutes = OTP_EXPIRY_MINUTES) {
  const subject = `${COMPANY_NAME} — Your One-Time Verification Code`;
  const text = [
    `Hello,`,
    ``,
    `Your ${COMPANY_NAME} verification code is: ${otp}`,
    `This code will expire in ${expiresInMinutes} minute(s).`,
    ``,
    `If you did not request this, please ignore this email or contact support: ${SUPPORT_EMAIL}`,
    ``,
    `Thank you,`,
    `${COMPANY_NAME} Team`
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; color:#111; line-height:1.4;">
      <h2 style="margin:0 0 8px 0;">${COMPANY_NAME} — Verification Code</h2>
      <p style="margin:0 0 12px 0;">Use the code below to complete your action. It expires in <strong>${expiresInMinutes} minute(s)</strong>.</p>
      <div style="display:inline-block; padding:12px 18px; background:#f5f7fb; border-radius:6px; font-size:20px; letter-spacing:4px; margin:8px 0;">
        <strong>${otp}</strong>
      </div>
      <p style="color:#666; font-size:13px; margin-top:12px;">
        If you did not request this code, ignore this email or contact <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.
      </p>
      <hr style="border:none; border-top:1px solid #eee; margin:18px 0;">
      <small style="color:#999">This message was sent by ${COMPANY_NAME}. Please do not reply to this automated email.</small>
    </div>
  `;

  return { subject, text, html };
}
// ...existing code...
app.use(express.json()); // added: parse JSON bodies

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

    const { subject, text, html } = buildOtpEmail(otpStr);

    console.log('sendEmail declared params:', sendEmail.length, 'calling with (to, subject, {text, html})');

    // try common signatures: (to, subject, {text, html}) OR (to, subject, text)
    try {
      await sendEmail(email, subject, { text, html });
    } catch (err1) {
      console.warn('first sendEmail call failed, trying fallback signature:', err1 && err1.message);
      try {
        await sendEmail(email, subject, text);
      } catch (err2) {
        console.error('Both sendEmail attempts failed:', err1.stack || err1, err2.stack || err2);
        // return detailed message for debugging (remove in production)
        return res.status(502).json({ error: 'send_failed', message: (err2 && err2.message) || (err1 && err1.message) });
      }
    }

    return res.json({ ok: true, message: 'OTP sent' });
  } catch (err) {
    console.error('Send OTP unexpected error:', err.stack || err);
    return res.status(500).json({ error: 'send_failed', message: err.message });
  }
});
// ...existing code...
app.get('/test-email', async (req, res) => {
  try {
    await sendEmail('tarik.moumini@gmail.com', 'Test', 'Hello from my app!');
    res.send('Email sent!');
  } catch (err) {
    console.error('Send failed:', err);
    res.status(500).send('Send failed');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
// ...existing code...