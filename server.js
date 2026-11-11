require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const authRoutes = require('./routes/authRoutes');
const resultRoutes = require('./routes/resultRoutes');
const studentRoutes = require('./routes/studentRoutes');
const mockTestRoutes = require('./routes/mockTestRoutes');
const enquiryRoutes = require('./routes/enquiryRoutes');
const { generalLimiter } = require('./Middleware/rateLimiter');
const { logger, requestLogger, errorLogger } = require('./config/logger');
const { createDummyAdmin } = require('./controllers/authController');
const { seedInitialResults } = require('./controllers/resultController');
const { seedDefaultMockTests } = require('./controllers/mockTestController');

const app = express();
const PORT = process.env.PORT || 5000;

process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', { reason });
});

process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { stack: err.stack });
    process.exit(1);
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(generalLimiter);

// Ensure uploads directory exists on startup (safely handle read-only filesystem in serverless)
const uploadsDir = process.env.VERCEL ? path.join('/tmp', 'uploads') : path.join(__dirname, 'uploads');
try {
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
} catch (e) {
    logger.warn('Could not create uploads directory', { message: e.message });
}
app.use('/uploads', express.static(uploadsDir));

// Routes
app.get("/", (req, res) => {
    res.send("School ERP System API is running");
});

app.use('/auth', authRoutes);
app.use('/results', resultRoutes);
app.use('/students', studentRoutes);
app.use('/mock-tests', mockTestRoutes);
app.use('/enquiries', enquiryRoutes);

app.use(errorLogger);
app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
    });
});

// Database Connection Helper
let isDbConnected = false;
const connectDB = async () => {
    if (isDbConnected || mongoose.connection.readyState >= 1) {
        return;
    }
    if (!process.env.MONGO_URI) {
        logger.error('MONGO_URI is missing');
        return;
    }
    await mongoose.connect(process.env.MONGO_URI);
    isDbConnected = true;
    logger.info('MongoDB connected successfully');

    try {
        await createDummyAdmin();
        await seedInitialResults();
        await seedDefaultMockTests();
    } catch (seedErr) {
        logger.warn('Initial seeding warning', { message: seedErr.message });
    }
};

// In Vercel serverless environment: ensure DB is connected before request processing
if (process.env.VERCEL) {
    app.use(async (req, res, next) => {
        try {
            await connectDB();
            next();
        } catch (err) {
            next(err);
        }
    });
} else {
    // In local / standard server environment: start listener
    const startServer = async () => {
        try {
            await connectDB();
            app.listen(PORT, () => {
                logger.info(`Server running on port ${PORT}`, { env: process.env.NODE_ENV || 'development' });
            });
        } catch (error) {
            logger.error('Server startup failed', { stack: error.stack });
            process.exit(1);
        }
    };

    startServer();
}

module.exports = app;
