const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { logger } = require('../config/logger');
const { STATUS, sendResponse } = require('../utils/statusCode');

const signup = async (req, res) => {
    try {
        const { name, email, password, confirmPassword, role } = req.body;

        if (role === 'admin') {
            return sendResponse(res, STATUS.BAD_REQUEST, {
                message: 'Cannot sign up as admin directly',
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return sendResponse(res, STATUS.BAD_REQUEST, {
                message: 'User already exists',
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role: role || 'student'
        });

        await newUser.save();

        return sendResponse(res, STATUS.CREATED, {
            message: 'User created successfully',
        });
    } catch (err) {
        logger.error('Signup error', { stack: err.stack });
        return sendResponse(res, STATUS.INTERNAL_SERVER_ERROR, {
            message: 'Server error',
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return sendResponse(res, STATUS.UNAUTHORIZED, {
                message: 'Invalid credentials',
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return sendResponse(res, STATUS.UNAUTHORIZED, {
                message: 'Invalid credentials',
            });
        }

        const token = jwt.sign(
            { id: user._id.toString(), email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        return sendResponse(res, STATUS.OK, {
            message: 'Login successful',
            token,
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        logger.error('Login error', { stack: err.stack });
        return sendResponse(res, STATUS.INTERNAL_SERVER_ERROR, {
            message: 'Server error',
        });
    }
};

const createAdmin = async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return sendResponse(res, STATUS.BAD_REQUEST, {
                message: 'User with this email already exists',
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newAdmin = new User({
            name,
            email,
            password: hashedPassword,
            phone,
            address,
            role: 'admin'
        });

        await newAdmin.save();

        return sendResponse(res, STATUS.CREATED, {
            message: 'Admin user created successfully',
        });
    } catch (error) {
        logger.error('Create admin error', { stack: error.stack });
        return sendResponse(res, STATUS.INTERNAL_SERVER_ERROR, {
            message: 'Server error while creating admin user',
            error: error.message,
        });
    }
};

const createDummyAdmin = async () => {
    try {
        logger.info('Checking for admin...');

        const adminExist = await User.findOne({ email: 'admin@example.com' });

        if (!adminExist) {
            logger.info('Creating dummy admin...');

            const hashedPassword = await bcrypt.hash('admin123', 10);

            const dummyAdmin = new User({
                name: 'Dummy Admin',
                email: 'admin@example.com',
                password: hashedPassword,
                role: 'admin'
            });

            await dummyAdmin.save();

            logger.info('Dummy admin created successfully');
        } else {
            logger.info('Dummy admin already exists');
        }

    } catch (err) {
        logger.error('Dummy admin error', { stack: err.stack });
    }
};

module.exports = { signup, login, createAdmin, createDummyAdmin };
