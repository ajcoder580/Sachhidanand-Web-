const {
  safeParseEnquiryCreate,
  safeParseEnquiryStatusUpdate,
  safeParseEnquiryRemark,
} = require('./enquiry.validation');
const { validateBody } = require('./validate');

const validateEnquiryCreate = validateBody((body) => safeParseEnquiryCreate(body));
const validateEnquiryStatusUpdate = validateBody((body) => safeParseEnquiryStatusUpdate(body));
const validateEnquiryRemark = validateBody((body) => safeParseEnquiryRemark(body));

module.exports = {
  validateEnquiryCreate,
  validateEnquiryStatusUpdate,
  validateEnquiryRemark,
};
