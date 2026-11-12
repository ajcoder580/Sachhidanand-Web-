const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const { passwords, tokens } = require('../config/auth');
const { logger } = require('../config/logger');
const { STATUS, sendResponse } = require('../utils/statusCode');

const signup = async (req, res) => {
    try {
        const { name, email, password, role, phone } = req.body;

        if (role === 'admin') {
            return sendResponse(res, STATUS.BAD_REQUEST, {
                success: false,
                message: 'Admin accounts cannot be registered directly',
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return sendResponse(res, STATUS.BAD_REQUEST, {
                success: false,
                message: 'An account with this email address already exists',
            });
        }

        // Hash password securely with jay-auth-kit
        const hashedPassword = await passwords.hash(password);

        const newUser = new User({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: role || 'student',
            phone: phone ? phone.trim() : 'NA',
        });

        await newUser.save();

        // Automatically issue token on registration for smooth UX
        const token = tokens.sign(newUser._id.toString(), newUser.role);

        return sendResponse(res, STATUS.CREATED, {
            success: true,
            message: 'Account created successfully',
            token,
            user: {
                id: newUser._id.toString(),
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                phone: newUser.phone,
            },
        });
    } catch (err) {
        logger.error('Signup error', { stack: err.stack });
        return sendResponse(res, STATUS.INTERNAL_SERVER_ERROR, {
            success: false,
            message: 'Server error during registration',
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return sendResponse(res, STATUS.UNAUTHORIZED, {
                success: false,
                message: 'Invalid email or password',
            });
        }

        // Verify password using jay-auth-kit (with safe bcrypt fallback for legacy hashes)
        let isMatch = false;
        try {
            isMatch = await passwords.verify(password, user.password);
        } catch (e) {
            isMatch = await bcrypt.compare(password, user.password);
        }

        if (!isMatch) {
            return sendResponse(res, STATUS.UNAUTHORIZED, {
                success: false,
                message: 'Invalid email or password',
            });
        }

        // Issue JWT token using jay-auth-kit token manager
        const token = tokens.sign(user._id.toString(), user.role);

        return sendResponse(res, STATUS.OK, {
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                class: user.class,
                stream: user.stream,
            },
        });
    } catch (err) {
        logger.error('Login error', { stack: err.stack });
        return sendResponse(res, STATUS.INTERNAL_SERVER_ERROR, {
            success: false,
            message: 'Server error during login',
        });
    }
};

const getMe = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return sendResponse(res, STATUS.UNAUTHORIZED, {
                success: false,
                message: 'Not authenticated',
            });
        }

        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return sendResponse(res, STATUS.NOT_FOUND, {
                success: false,
                message: 'User profile not found',
            });
        }

        return sendResponse(res, STATUS.OK, {
            success: true,
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                class: user.class,
                stream: user.stream,
                city: user.city,
                state: user.state,
                preparingFor: user.preparingFor,
            },
        });
    } catch (err) {
        logger.error('Get profile error', { stack: err.stack });
        return sendResponse(res, STATUS.INTERNAL_SERVER_ERROR, {
            success: false,
            message: 'Server error retrieving user profile',
        });
    }
};

const getAuthStatus = async (req, res) => {
    if (req.user) {
        return sendResponse(res, STATUS.OK, {
            authenticated: true,
            user: req.user,
        });
    }
    return sendResponse(res, STATUS.OK, {
        authenticated: false,
        user: null,
    });
};

const updateProfile = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return sendResponse(res, STATUS.UNAUTHORIZED, {
                success: false,
                message: 'Not authenticated',
            });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return sendResponse(res, STATUS.NOT_FOUND, {
                success: false,
                message: 'User profile not found',
            });
        }

        const { name, phone, city, state, country, address, profilePicture, email } = req.body;

        // If email is being changed, ensure it's not already in use by someone else
        if (email && email.toLowerCase().trim() !== user.email) {
            const emailTaken = await User.findOne({
                email: email.toLowerCase().trim(),
                _id: { $ne: user._id }
            });
            if (emailTaken) {
                return sendResponse(res, STATUS.BAD_REQUEST, {
                    success: false,
                    message: 'Email address is already in use by another account',
                });
            }
            user.email = email.toLowerCase().trim();
        }

        if (name && name.trim()) user.name = name.trim();
        if (phone !== undefined) user.phone = phone ? phone.trim() : 'NA';
        if (city !== undefined) user.city = city ? city.trim() : 'NA';
        if (state !== undefined) user.state = state ? state.trim() : 'NA';
        if (country !== undefined) user.country = country ? country.trim() : 'India';
        if (address !== undefined) user.address = address ? address.trim() : 'NA';
        if (profilePicture !== undefined) user.profilePicture = profilePicture;

        await user.save();

        return sendResponse(res, STATUS.OK, {
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                city: user.city,
                state: user.state,
                country: user.country,
                address: user.address,
                profilePicture: user.profilePicture,
            },
        });
    } catch (err) {
        logger.error('Update profile error', { stack: err.stack });
        return sendResponse(res, STATUS.INTERNAL_SERVER_ERROR, {
            success: false,
            message: 'Failed to update profile',
        });
    }
};

const changePassword = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return sendResponse(res, STATUS.UNAUTHORIZED, {
                success: false,
                message: 'Not authenticated',
            });
        }

        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword) {
            return sendResponse(res, STATUS.BAD_REQUEST, {
                success: false,
                message: 'Current password is required to change password',
            });
        }

        if (!newPassword || newPassword.length < 6) {
            return sendResponse(res, STATUS.BAD_REQUEST, {
                success: false,
                message: 'New password must be at least 6 characters long',
            });
        }

        if (confirmPassword && newPassword !== confirmPassword) {
            return sendResponse(res, STATUS.BAD_REQUEST, {
                success: false,
                message: 'Confirm password does not match new password',
            });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return sendResponse(res, STATUS.NOT_FOUND, {
                success: false,
                message: 'User account not found',
            });
        }

        // Verify that current password is valid
        let isMatch = false;
        try {
            isMatch = await passwords.verify(currentPassword, user.password);
        } catch (e) {
            isMatch = await bcrypt.compare(currentPassword, user.password);
        }

        if (!isMatch) {
            return sendResponse(res, STATUS.BAD_REQUEST, {
                success: false,
                message: 'Current password is incorrect. Please verify your current password.',
            });
        }

        // Ensure new password differs from current password
        let isSame = false;
        try {
            isSame = await passwords.verify(newPassword, user.password);
        } catch (e) {
            isSame = await bcrypt.compare(newPassword, user.password);
        }

        if (isSame) {
            return sendResponse(res, STATUS.BAD_REQUEST, {
                success: false,
                message: 'New password must be different from current password',
            });
        }

        // Hash new password using jay-auth-kit
        const hashedNewPassword = await passwords.hash(newPassword);
        user.password = hashedNewPassword;
        await user.save();

        logger.info(`Password successfully changed for ${user.email}`);

        return sendResponse(res, STATUS.OK, {
            success: true,
            message: 'Password changed successfully',
        });
    } catch (err) {
        logger.error('Change password error', { stack: err.stack });
        return sendResponse(res, STATUS.INTERNAL_SERVER_ERROR, {
            success: false,
            message: 'Failed to change password. Please try again.',
        });
    }
};

const createAdmin = async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;

        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return sendResponse(res, STATUS.BAD_REQUEST, {
                success: false,
                message: 'A user with this email already exists',
            });
        }

        const hashedPassword = await passwords.hash(password);
        const newAdmin = new User({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            phone: phone ? phone.trim() : 'NA',
            address: address || 'NA',
            role: 'admin',
        });

        await newAdmin.save();

        return sendResponse(res, STATUS.CREATED, {
            success: true,
            message: 'Admin user created successfully',
            admin: {
                id: newAdmin._id.toString(),
                name: newAdmin.name,
                email: newAdmin.email,
                role: 'admin',
            },
        });
    } catch (error) {
        logger.error('Create admin error', { stack: error.stack });
        return sendResponse(res, STATUS.INTERNAL_SERVER_ERROR, {
            success: false,
            message: 'Server error while creating admin user',
        });
    }
};

// Admin Seeder: Runs when server starts; skips if user with same email exists
const seedInitialAdmin = async () => {
    try {
        const adminEmail = (process.env.ADMIN_EMAIL || 'jsharma.dbg@gmail.com').toLowerCase().trim();
        const adminPassword = process.env.ADMIN_PASSWORD || 'jay@123';
        const adminName = (process.env.ADMIN_NAME || 'Admin').trim();

        // If an account with this same email already exists, skip seeding
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            logger.info(`Admin with email "${adminEmail}" already exists. Skipping seed.`);
            return;
        }

        logger.info(`Seeding admin account for "${adminEmail}"...`);
        const hashedPassword = await passwords.hash(adminPassword);

        const admin = new User({
            name: adminName,
            email: adminEmail,
            password: hashedPassword,
            role: 'admin',
            phone: '9876543210',
        });

        await admin.save();
        logger.info(`Admin account (${adminName} <${adminEmail}>) seeded successfully.`);
    } catch (err) {
        logger.error('Admin seeding error', { stack: err.stack });
    }
};

module.exports = {
    signup,
    login,
    getMe,
    getAuthStatus,
    updateProfile,
    changePassword,
    createAdmin,
    seedInitialAdmin,
};
