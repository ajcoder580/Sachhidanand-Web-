const BRAND_NAME = 'Sachidanand Coaching Center';

const baseLayout = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${BRAND_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6f8;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a8a,#1e40af);padding:24px 28px;">
              <h1 style="margin:0;font-size:22px;color:#ffffff;">${BRAND_NAME}</h1>
              <p style="margin:8px 0 0;color:#dbeafe;font-size:14px;">Empowering students to achieve their dreams</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;text-align:center;">
              &copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const row = (label, value) => `
  <tr>
    <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:600;width:140px;vertical-align:top;color:#374151;">${label}</td>
    <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#111827;">${value || '—'}</td>
  </tr>
`;

const contactEnquiryTemplate = ({ name, email, phone, course, message, enquiryType }) => {
  const subject = enquiryType
    ? `New ${enquiryType} enquiry from ${name}`
    : `New contact message from ${name}`;

  const html = baseLayout(`
    <h2 style="margin:0 0 16px;font-size:20px;color:#111827;">New Enquiry Received</h2>
    <p style="margin:0 0 20px;color:#4b5563;line-height:1.6;">A new enquiry has been submitted through the website.</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;">
      ${row('Name', name)}
      ${row('Email', email)}
      ${row('Phone', phone)}
      ${row('Course', course)}
      ${row('Enquiry Type', enquiryType)}
      ${row('Message', message?.replace(/\n/g, '<br />'))}
    </table>
  `);

  const text = [
    'New Enquiry Received',
    '',
    `Name: ${name}`,
    `Email: ${email || '—'}`,
    `Phone: ${phone || '—'}`,
    `Course: ${course || '—'}`,
    `Enquiry Type: ${enquiryType || '—'}`,
    `Message: ${message || '—'}`,
  ].join('\n');

  return { subject, html, text };
};

const enquiryConfirmationTemplate = ({ name }) => {
  const subject = `Thank you for contacting ${BRAND_NAME}`;

  const html = baseLayout(`
    <h2 style="margin:0 0 16px;font-size:20px;color:#111827;">Thank you, ${name}!</h2>
    <p style="margin:0 0 12px;color:#4b5563;line-height:1.6;">
      We have received your enquiry. Our team will review it and get back to you shortly.
    </p>
    <p style="margin:0;color:#4b5563;line-height:1.6;">
      For urgent queries, call us at <strong>+91 98765 43210</strong>.
    </p>
  `);

  const text = `Thank you, ${name}! We have received your enquiry and will contact you soon.`;

  return { subject, html, text };
};

const welcomeEmailTemplate = ({ name, email }) => {
  const subject = `Welcome to ${BRAND_NAME}`;

  const html = baseLayout(`
    <h2 style="margin:0 0 16px;font-size:20px;color:#111827;">Welcome, ${name}!</h2>
    <p style="margin:0 0 12px;color:#4b5563;line-height:1.6;">
      Your account has been created successfully with <strong>${email}</strong>.
    </p>
    <p style="margin:0;color:#4b5563;line-height:1.6;">
      Log in to access your student dashboard, study materials, and more.
    </p>
  `);

  const text = `Welcome, ${name}! Your account (${email}) has been created successfully.`;

  return { subject, html, text };
};

module.exports = {
  BRAND_NAME,
  contactEnquiryTemplate,
  enquiryConfirmationTemplate,
  welcomeEmailTemplate,
};
