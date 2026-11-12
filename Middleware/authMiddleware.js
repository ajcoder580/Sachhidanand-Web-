const joi = require('joi');
const User = require('../models/userModel');
const { tokens } = require('../config/auth');
const { logger } = require('../config/logger');

// Middleware to verify JWT token using jay-auth-kit
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No authentication token provided.'
        });
    }

    try {
        const payload = tokens.verify(token);
        const userId = payload.sub || payload.id;

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Account not found or session revoked.'
            });
        }

        req.user = {
            id: user._id.toString(),
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            class: user.class,
            stream: user.stream
        };

        next();
    } catch (error) {
        logger.warn('Token verification failed', { message: error.message });
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired session. Please log in again.'
        });
    }
};

const signupValidation = (req, res, next) => {
    const schema = joi.object({
        name: joi.string().min(2).max(50).required(),
        email: joi.string().email().required(),
        password: joi.string().min(6).max(72).required(),
        confirmPassword: joi.string().min(6).max(72).required()
            .valid(joi.ref('password'))
            .messages({
                'any.only': 'Confirm password must match password',
                'string.empty': 'Confirm password cannot be empty'
            }),
        role: joi.string().valid('student', 'teacher').default('student'),
        phone: joi.string().allow('', null).optional()
    }).unknown(true);

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details?.[0]?.message || 'Validation error',
            error: error.details
        });
    }
    next();
};

const loginValidation = (req, res, next) => {
    const schema = joi.object({
        email: joi.string().email().required(),
        password: joi.string().min(4).max(72).required()
    }).unknown(true);

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details?.[0]?.message || 'Validation error',
            error: error.details
        });
    }
    next();
};

// Middleware for optional JWT token verification
const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        try {
            const payload = tokens.verify(token);
            const userId = payload.sub || payload.id;
            const user = await User.findById(userId).select('-password');
            if (user) {
                req.user = {
                    id: user._id.toString(),
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    phone: user.phone,
                    class: user.class,
                    stream: user.stream
                };
            } else {
                req.user = null;
            }
        } catch (error) {
            req.user = null;
        }
    } else {
        req.user = null;
    }
    next();
};

const updateProfileValidation = (req, res, next) => {
    const schema = joi.object({
        name: joi.string().min(2).max(60).optional(),
        email: joi.string().email().optional(),
        phone: joi.string().allow('', null).optional(),
        city: joi.string().allow('', null).optional(),
        state: joi.string().allow('', null).optional(),
        country: joi.string().allow('', null).optional(),
        address: joi.string().allow('', null).optional(),
        profilePicture: joi.string().allow('', null).optional(),
    }).unknown(true);

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details?.[0]?.message || 'Validation error',
            error: error.details,
        });
    }
    next();
};

const changePasswordValidation = (req, res, next) => {
    const schema = joi.object({
        currentPassword: joi.string().required().messages({
            'any.required': 'Current password is required',
            'string.empty': 'Current password cannot be empty',
        }),
        newPassword: joi.string().min(6).max(72).required().messages({
            'any.required': 'New password is required',
            'string.min': 'New password must be at least 6 characters long',
            'string.empty': 'New password cannot be empty',
        }),
        confirmPassword: joi.string().valid(joi.ref('newPassword')).optional().messages({
            'any.only': 'Confirm password must match new password',
        }),
    }).unknown(true);

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details?.[0]?.message || 'Validation error',
            error: error.details,
        });
    }
    next();
};

module.exports = {
    signupValidation,
    loginValidation,
    updateProfileValidation,
    changePasswordValidation,
    authenticateToken,
    optionalAuth
};
