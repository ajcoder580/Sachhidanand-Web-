const express = require('express');
const router = express.Router();
const { signup, login, createAdmin } = require('../controllers/authController');
const { signupValidation, loginValidation, authenticateToken } = require('../Middleware/authMiddleware');
const authorizeRoles = require('../Middleware/AuthoriseRole');
const { loginLimiter, userIpLimiter } = require('../Middleware/rateLimiter');

router.post('/signup', signupValidation, signup);
router.post('/login', loginLimiter, loginValidation, login);

router.get('/protected', authenticateToken, userIpLimiter, authorizeRoles('admin'), (req, res) =>{
    res.json({
        message:"Admin Protected Route",
        user:req.user
    })
});

router.post('/create-admin', authenticateToken, userIpLimiter, authorizeRoles('admin'), createAdmin);

module.exports = router;