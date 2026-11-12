const express = require('express');
const router = express.Router();
const {
    signup,
    login,
    getMe,
    getAuthStatus,
    updateProfile,
    changePassword,
    createAdmin,
} = require('../controllers/authController');
const {
    signupValidation,
    loginValidation,
    updateProfileValidation,
    changePasswordValidation,
    authenticateToken,
    optionalAuth,
} = require('../Middleware/authMiddleware');
const authorizeRoles = require('../Middleware/AuthoriseRole');
const { loginLimiter, userIpLimiter } = require('../Middleware/rateLimiter');

// Public Auth Endpoints
router.post('/signup', signupValidation, signup);
router.post('/login', loginLimiter, loginValidation, login);
router.get('/status', optionalAuth, getAuthStatus);

// Authenticated Endpoints
router.get('/me', authenticateToken, userIpLimiter, getMe);

// Edit Profile Route (PATCH)
router.patch('/profile', authenticateToken, userIpLimiter, updateProfileValidation, updateProfile);
router.patch('/admin/profile', authenticateToken, userIpLimiter, authorizeRoles('admin'), updateProfileValidation, updateProfile);

// Change Password Route (Requires current password verification)
router.patch('/change-password', authenticateToken, userIpLimiter, changePasswordValidation, changePassword);
router.post('/change-password', authenticateToken, userIpLimiter, changePasswordValidation, changePassword);
router.patch('/admin/change-password', authenticateToken, userIpLimiter, authorizeRoles('admin'), changePasswordValidation, changePassword);

// Admin-only Management Endpoints
router.get('/protected', authenticateToken, userIpLimiter, authorizeRoles('admin'), (req, res) => {
    res.json({
        success: true,
        message: 'Admin Protected Route',
        user: req.user,
    });
});

router.post('/create-admin', authenticateToken, userIpLimiter, authorizeRoles('admin'), createAdmin);

module.exports = router;
