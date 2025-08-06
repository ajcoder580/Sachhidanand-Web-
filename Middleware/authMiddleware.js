const joi = require('joi');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    // Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.', success: false });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Add user from payload
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(403).json({ message: 'Invalid or expired token', success: false });
    }
};

const signupValidation = (req, res, next) => {
   const schema =  joi.object({
    name: joi.string().min(2).max(50).required(),
    email: joi.string().email().required(),
    password: joi.string().min(6).max(20).required(),
    confirmPassword:joi.string().min(6).max(20).required().
      valid(joi.ref('password'))
        .messages({
            'any.only': 'Confirm password must be same as password',
            'string.empty': 'Confirm password cannot be empty'
        }),
    role: joi.string().valid('student',"teacher","admin").required()
  
});
    const {error}  = schema.validate(req.body);
    if(error){
        return res.status(400)
             .json({message:"Bad Request", error})
    }
    next();
};

const loginValidation = (req, res, next) => {
    const schema =  joi.object({
     email: joi.string().email().required(),
     password: joi.string().min(6).max(20).required()
     // role not needed for login - we'll get it from the database
 });
     const {error}  = schema.validate(req.body);
     if(error){
         return res.status(400)
              .json({message:"Bad Request", error})
     }
     next();
 };

 module.exports = {
    signupValidation,
    loginValidation,
    authenticateToken
};