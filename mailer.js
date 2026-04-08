const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,     // your gmail address
    pass: process.env.GMAIL_APP_PASS  // your app password
  }
});

/**
 * sendEmail(to, subject, html)
 * - Always sends `html` as the HTML part
 * - Automatically generates a plain-text fallback
 */
const sendEmail = async (to, subject, html) => {
  if (!to || !subject) throw new TypeError('to and subject are required');

  const textFallback = typeof html === 'string'
    ? html.replace(/<[^>]+>/g, '').replace(/\s{2,}/g, ' ').trim()
    : '';

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to,
    subject,
    html,
    text: textFallback
  };

  return transporter.sendMail(mailOptions);
};

module.exports = sendEmail;