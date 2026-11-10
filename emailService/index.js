const { logger } = require('../config/logger');
const { sendViaSmtp, isSmtpConfigured } = require('./smtp');
const { sendViaResend, isResendConfigured } = require('./resend');
const {
  contactEnquiryTemplate,
  enquiryConfirmationTemplate,
  welcomeEmailTemplate,
} = require('./emailTemplate');

const getEmailProvider = () => (process.env.EMAIL_PROVIDER || 'resend').toLowerCase();

const getDefaultFrom = () =>
  process.env.EMAIL_FROM || 'Sachidanand Coaching <onboarding@resend.dev>';

const getAdminEmail = () => process.env.ADMIN_EMAIL || process.env.EMAIL_FROM;

const resolveProvider = () => {
  const preferred = getEmailProvider();

  if (preferred === 'smtp' && isSmtpConfigured()) return 'smtp';
  if (preferred === 'resend' && isResendConfigured()) return 'resend';

  if (isResendConfigured()) return 'resend';
  if (isSmtpConfigured()) return 'smtp';

  return null;
};

const sendEmail = async ({ to, subject, html, text, from, replyTo }) => {
  const provider = resolveProvider();

  if (!provider) {
    throw new Error(
      'No email provider configured. Set RESEND_API_KEY or SMTP_HOST/SMTP_USER/SMTP_PASS.'
    );
  }

  const payload = {
    from: from || getDefaultFrom(),
    to,
    subject,
    html,
    text,
    replyTo,
  };

  if (provider === 'smtp') {
    return sendViaSmtp(payload);
  }

  return sendViaResend(payload);
};

const sendContactEnquiry = async (data) => {
  const { subject, html, text } = contactEnquiryTemplate(data);
  const adminEmail = getAdminEmail();

  if (!adminEmail) {
    throw new Error('ADMIN_EMAIL or EMAIL_FROM must be set to receive enquiries.');
  }

  const result = await sendEmail({
    to: adminEmail,
    subject,
    html,
    text,
    replyTo: data.email,
  });

  logger.info('Contact enquiry email sent to admin', { name: data.name });
  return result;
};

const sendEnquiryConfirmation = async ({ name, email }) => {
  if (!email) return null;

  const { subject, html, text } = enquiryConfirmationTemplate({ name });

  const result = await sendEmail({ to: email, subject, html, text });
  logger.info('Enquiry confirmation email sent', { email });
  return result;
};

const sendWelcomeEmail = async ({ name, email }) => {
  if (!email) return null;

  const { subject, html, text } = welcomeEmailTemplate({ name, email });

  const result = await sendEmail({ to: email, subject, html, text });
  logger.info('Welcome email sent', { email });
  return result;
};

module.exports = {
  sendEmail,
  sendContactEnquiry,
  sendEnquiryConfirmation,
  sendWelcomeEmail,
  contactEnquiryTemplate,
  enquiryConfirmationTemplate,
  welcomeEmailTemplate,
  getEmailProvider,
  resolveProvider,
  isSmtpConfigured,
  isResendConfigured,
};
