const { z } = require('zod');

const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

const enquiryCreateSchema = z
  .object({
    name: z
      .string({ required_error: 'Name is required' })
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be less than 100 characters'),

    mobileNumber: z
      .string({ required_error: 'Mobile number is required' })
      .trim()
      .regex(INDIAN_MOBILE_REGEX, 'Please enter a valid 10-digit mobile number'),

    admissionType: z
      .string({ required_error: 'Admission type is required' })
      .trim()
      .min(1, 'Admission type is required')
      .max(50, 'Admission type must be less than 50 characters'),

    message: z
      .string({ required_error: 'Message is required' })
      .trim()
      .min(5, 'Message must be at least 5 characters')
      .max(1000, 'Message must be less than 1000 characters'),
  })
  .strict();

const normalizeEnquiryBody = (body = {}) => ({
  name: body.name,
  mobileNumber: body.mobileNumber ?? body.mobile,
  admissionType: body.admissionType ?? body.enquiryType,
  message: body.message,
});

const parseEnquiryCreate = (body) => {
  const normalized = normalizeEnquiryBody(body);

  if (normalized.mobileNumber) {
    normalized.mobileNumber = String(normalized.mobileNumber).replace(/\D/g, '').slice(0, 10);
  }

  return enquiryCreateSchema.parse(normalized);
};

const safeParseEnquiryCreate = (body) => {
  try {
    const data = parseEnquiryCreate(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.flatten().fieldErrors };
    }
    throw error;
  }
};

const enquiryStatusUpdateSchema = z.object({
  status: z.enum(['new', 'contacted', 'closed'], {
    required_error: 'Status is required',
    invalid_type_error: 'Status must be new, contacted, or closed',
  }),
});

const enquiryRemarkSchema = z.object({
  remark: z
    .string({ required_error: 'Remark is required' })
    .trim()
    .min(1, 'Remark is required')
    .max(500, 'Remark must be less than 500 characters'),
});

const safeParseEnquiryStatusUpdate = (body) => {
  try {
    const data = enquiryStatusUpdateSchema.parse(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.flatten().fieldErrors };
    }
    throw error;
  }
};

const safeParseEnquiryRemark = (body) => {
  try {
    const data = enquiryRemarkSchema.parse(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.flatten().fieldErrors };
    }
    throw error;
  }
};

module.exports = {
  enquiryCreateSchema,
  enquiryStatusUpdateSchema,
  enquiryRemarkSchema,
  parseEnquiryCreate,
  safeParseEnquiryCreate,
  safeParseEnquiryStatusUpdate,
  safeParseEnquiryRemark,
  normalizeEnquiryBody,
};
