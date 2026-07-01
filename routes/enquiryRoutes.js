const express = require('express');
const router = express.Router();
const {
  createEnquiry,
  adminGetEnquiries,
  adminGetEnquiryStats,
  adminGetEnquiryById,
  adminUpdateEnquiryStatus,
  adminAddEnquiryRemark,
  adminDeleteEnquiry,
} = require('../controllers/enquiryController');
const { authenticateToken } = require('../Middleware/authMiddleware');
const authorizeRoles = require('../Middleware/AuthoriseRole');
const { userIpLimiter } = require('../Middleware/rateLimiter');
const {
  validateEnquiryCreate,
  validateEnquiryStatusUpdate,
  validateEnquiryRemark,
} = require('../validations');

// Public — submit enquiry
router.post('/', validateEnquiryCreate, createEnquiry);

// Admin routes
router.get('/admin/stats', authenticateToken, userIpLimiter, authorizeRoles('admin'), adminGetEnquiryStats);
router.get('/admin', authenticateToken, userIpLimiter, authorizeRoles('admin'), adminGetEnquiries);
router.get('/admin/:id', authenticateToken, userIpLimiter, authorizeRoles('admin'), adminGetEnquiryById);
router.patch(
  '/admin/:id/status',
  authenticateToken,
  userIpLimiter,
  authorizeRoles('admin'),
  validateEnquiryStatusUpdate,
  adminUpdateEnquiryStatus
);
router.post(
  '/admin/:id/remarks',
  authenticateToken,
  userIpLimiter,
  authorizeRoles('admin'),
  validateEnquiryRemark,
  adminAddEnquiryRemark
);
router.delete('/admin/:id', authenticateToken, userIpLimiter, authorizeRoles('admin'), adminDeleteEnquiry);

module.exports = router;
