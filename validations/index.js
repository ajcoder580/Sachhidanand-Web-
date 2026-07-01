const { safeParseEnquiryCreate } = require('./enquiry.validation');
const { validateBody } = require('./validate');

const validateEnquiryCreate = validateBody((body) => safeParseEnquiryCreate(body));

module.exports = {
  validateEnquiryCreate,
};
