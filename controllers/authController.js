const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { logger } = require('../config/logger');

const signup = async (req, res) => {
    try {
        const { name, email, password, confirmPassword, role } = req.body;

        // Block signup with admin role
        if (role === 'admin') {
            return res.status(400).json({ message: 'Cannot sign up as admin directly', success: false });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role: role || 'student'
        });

        await newUser.save();

        res.status(201).json({ message: 'User created successfully', success: true });
    } catch (err) {
        logger.error('Signup error', { stack: err.stack });
        res.status(500).json({ message: 'Server error', success: false });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate user
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        // Convert MongoDB ObjectId to string for consistent format
        const token = jwt.sign(
            { id: user._id.toString(), email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id.toString(), // Ensure ID is a string
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        logger.error('Login error', { stack: err.stack });
        res.status(500).json({ message: 'Server error', success: false });
    }
};

const createAdmin = async (req, res) => {
    try {
        // Extract admin user data from request body
        const { name, email, password, phone, address } = req.body;

        // Check if user with this email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User with this email already exists' });
        }

        // Create new admin user
        const hashedPassword = await bcrypt.hash(password, 10);
        const newAdmin = new User({
            name,
            email,
            password: hashedPassword,
            phone,
            address,
            role: 'admin' // Force role to be admin
        });

        await newAdmin.save();

        res.status(201).json({
            success: true,
            message: 'Admin user created successfully'
        });
    } catch (error) {
        logger.error('Create admin error', { stack: error.stack });
        res.status(500).json({
            success: false,
            message: 'Server error while creating admin user',
            error: error.message
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
