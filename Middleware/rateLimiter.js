const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 8,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many login attempts. Please try again after 1 minute.',
    },
});

const generalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => Boolean(req.headers.authorization),
    message: {
        success: false,
        message: 'Too many requests from this IP. Please try again after 1 minute.',
    },
});

const userIpLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 70,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        const userId = req.user?.id || req.user?._id || 'anonymous';
        const ip = req.ip || req.socket?.remoteAddress || 'unknown';
        return `${userId}:${ip}`;
    },
    message: {
        success: false,
        message: 'Too many requests. Please try again after 1 minute.',
    },
});

module.exports = {
    loginLimiter,
    generalLimiter,
    userIpLimiter,
};
