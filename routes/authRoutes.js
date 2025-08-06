const express = require('express');
const router = express.Router();
const { signup, login} = require('../controllers/authController');
const { signupValidation, loginValidation } = require('../Middleware/authMiddleware');
// const authorizeRoles = require('../Middleware/AuthoriseRole');
const jwt = require('jsonwebtoken');

router.post('/signup', signupValidation, signup);
router.post('/login', loginValidation, login);

module.exports = router;