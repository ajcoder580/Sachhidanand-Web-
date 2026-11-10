const {
  validateEnquiryCreate,
  validateEnquiryStatusUpdate,
  validateEnquiryRemark,
} = require('./enquiry.middleware');

module.exports = {
  validateEnquiryCreate,
  validateEnquiryStatusUpdate,
  validateEnquiryRemark,
};
