const nodemailer = require('nodemailer');
const { logger } = require('../config/logger');

let transporter = null;

const isSmtpConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const getTransporter = () => {
  if (!isSmtpConfigured()) {
    throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.');
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return transporter;
};

const sendViaSmtp = async ({ from, to, subject, html, text, replyTo }) => {
  const mailOptions = {
    from,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    html,
    ...(text && { text }),
    ...(replyTo && { replyTo }),
  };

  const info = await getTransporter().sendMail(mailOptions);
  logger.info('Email sent via SMTP', { messageId: info.messageId, to: mailOptions.to });
  return info;
};

const verifySmtpConnection = async () => {
  const transport = getTransporter();
  await transport.verify();
  logger.info('SMTP connection verified');
};

module.exports = {
  isSmtpConfigured,
  sendViaSmtp,
  verifySmtpConnection,
};
