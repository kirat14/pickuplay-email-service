const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,     // your gmail address
    pass: process.env.GMAIL_APP_PASS  // your app password
  }
});

const sendEmail = async (to, subject, text) => {
  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to,
    subject,
    text
  });
};

module.exports = sendEmail;