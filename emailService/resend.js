const { Resend } = require('resend');
const { logger } = require('../config/logger');

let resendClient = null;

const isResendConfigured = () => Boolean(process.env.RESEND_API_KEY);

const getResendClient = () => {
  if (!isResendConfigured()) {
    throw new Error('Resend is not configured. Set RESEND_API_KEY.');
  }

  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }

  return resendClient;
};

const sendViaResend = async ({ from, to, subject, html, text, replyTo }) => {
  const resend = getResendClient();

  const { data, error } = await resend.emails.send({
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    ...(text && { text }),
    ...(replyTo && { reply_to: replyTo }),
  });

  if (error) {
    throw new Error(error.message || 'Resend email failed');
  }

  logger.info('Email sent via Resend', { id: data?.id, to });
  return data;
};

module.exports = {
  isResendConfigured,
  sendViaResend,
};
