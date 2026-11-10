const express = require('express');
const router = express.Router();
const upload = require('../Middleware/uploadMiddleware');
const {
    uploadDocument,
    applyAdmission,
    getMyApplication,
    editMyApplication,
    adminGetApplications,
    adminGetApplicationById,
    adminUpdateStatus,
    adminUpdateApplication,
    adminDeleteApplication,
    adminGetStats
} = require('../controllers/studentController');

const { authenticateToken } = require('../Middleware/authMiddleware');
const authorizeRoles = require('../Middleware/AuthoriseRole');
const { userIpLimiter } = require('../Middleware/rateLimiter');

// Upload document (Authenticated users)
router.post('/upload', authenticateToken, userIpLimiter, upload.single('document'), uploadDocument);

// Student Panel routes
router.post('/apply', authenticateToken, userIpLimiter, authorizeRoles('student'), applyAdmission);
router.get('/my-application', authenticateToken, userIpLimiter, authorizeRoles('student'), getMyApplication);
router.put('/my-application', authenticateToken, userIpLimiter, authorizeRoles('student'), editMyApplication);

// Admin Panel routes
router.get('/admin/stats', authenticateToken, userIpLimiter, authorizeRoles('admin'), adminGetStats);
router.get('/admin/applications', authenticateToken, userIpLimiter, authorizeRoles('admin'), adminGetApplications);
router.get('/admin/applications/:id', authenticateToken, userIpLimiter, authorizeRoles('admin'), adminGetApplicationById);
router.put('/admin/applications/:id/status', authenticateToken, userIpLimiter, authorizeRoles('admin'), adminUpdateStatus);
router.put('/admin/applications/:id', authenticateToken, userIpLimiter, authorizeRoles('admin'), adminUpdateApplication);
router.delete('/admin/applications/:id', authenticateToken, userIpLimiter, authorizeRoles('admin'), adminDeleteApplication);

module.exports = router;
