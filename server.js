require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const authRoutes = require('./routes/authRoutes');
const resultRoutes = require('./routes/resultRoutes');
const studentRoutes = require('./routes/studentRoutes');
const { generalLimiter } = require('./Middleware/rateLimiter');
const { logger, requestLogger, errorLogger } = require('./config/logger');
const { createDummyAdmin } = require('./controllers/authController');
const { seedInitialResults } = require('./controllers/resultController');

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

// Ensure uploads directory exists on startup
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Routes
app.get("/", (req, res) => {
    res.send("School ERP System API is running");
     res.send("School ERP System API is running");
    
});

app.use('/auth', authRoutes);
app.use('/results', resultRoutes);
app.use('/students', studentRoutes);

app.use(errorLogger);
app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
    });
});

// Connect DB and Start Server
const startServer = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        logger.info('MongoDB connected successfully');

        await createDummyAdmin();
        await seedInitialResults();

        app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`, { env: process.env.NODE_ENV || 'development' });
        });

    } catch (error) {
        logger.error('Server startup failed', { stack: error.stack });
        process.exit(1);
    }
};

startServer();