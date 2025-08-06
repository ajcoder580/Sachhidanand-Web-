const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const signup = async (req, res) => {
    try {
        const { name, email, password,confirmPassword, role } = req.body;

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
            confirmPassword:hashedPassword,
            role: role || 'student'
        });

        await newUser.save();

        res.status(201).json({ message: 'User created successfully', success: true });
    } catch (err) {
        console.error('Signup Error:', err);
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
        console.error('Login Error:', err);
        res.status(500).json({ message: 'Server error', success: false });
    }
};

const createAdmin = async (req, res) => {
    try {
        // Extract admin user data from request body
        const { name, email, password, phone, address } = req.body;

        // Check if user is authenticated and is an admin
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Verify the user making the request is an admin
            const requestingUser = await User.findById(decoded.id);
            if (!requestingUser || requestingUser.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Forbidden: Only admins can create other admin accounts' });
            }
        } catch (error) {
            return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
        }

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
        console.error('Create Admin Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating admin user',
            error: error.message
        });
    }
};

module.exports = { signup, login, createAdmin };
