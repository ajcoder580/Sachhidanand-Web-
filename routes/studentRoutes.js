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

// Upload document (Authenticated users)
router.post('/upload', authenticateToken, upload.single('document'), uploadDocument);

// Student Panel routes
router.post('/apply', authenticateToken, authorizeRoles('student'), applyAdmission);
router.get('/my-application', authenticateToken, authorizeRoles('student'), getMyApplication);
router.put('/my-application', authenticateToken, authorizeRoles('student'), editMyApplication);

// Admin Panel routes
router.get('/admin/stats', authenticateToken, authorizeRoles('admin'), adminGetStats);
router.get('/admin/applications', authenticateToken, authorizeRoles('admin'), adminGetApplications);
router.get('/admin/applications/:id', authenticateToken, authorizeRoles('admin'), adminGetApplicationById);
router.put('/admin/applications/:id/status', authenticateToken, authorizeRoles('admin'), adminUpdateStatus);
router.put('/admin/applications/:id', authenticateToken, authorizeRoles('admin'), adminUpdateApplication);
router.delete('/admin/applications/:id', authenticateToken, authorizeRoles('admin'), adminDeleteApplication);

module.exports = router;
