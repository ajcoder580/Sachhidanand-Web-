const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const authRoutes = require('./routes/authRoutes');
const resultRoutes = require('./routes/resultRoutes');
const studentRoutes = require('./routes/studentRoutes');
const { createDummyAdmin } = require('./controllers/authController');
const { seedInitialResults } = require('./controllers/resultController');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Connect DB and Start Server
const startServer = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected successfully");

        // Create dummy admin if not exists
        await createDummyAdmin();

        // Seed default results if empty
        await seedInitialResults();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Server startup failed:", error);
    }
};

startServer();