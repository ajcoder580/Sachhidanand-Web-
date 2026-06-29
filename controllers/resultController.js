const Result = require('../models/resultModel');
const { logger } = require('../config/logger');

// Get all results
const getResults = async (req, res) => {
    try {
        const results = await Result.find({}).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: results });
    } catch (error) {
        logger.error('Get results error', { stack: error.stack });
        res.status(500).json({ success: false, message: 'Server error while fetching results', error: error.message });
    }
};

// Create a result
const createResult = async (req, res) => {
    try {
        const { name, exam, rank, score, image, college } = req.body;
        
        const newResult = new Result({
            name,
            exam,
            rank,
            score,
            image: image || undefined,
            college
        });
        
        await newResult.save();
        res.status(201).json({ success: true, message: 'Result created successfully', data: newResult });
    } catch (error) {
        logger.error('Create result error', { stack: error.stack });
        res.status(500).json({ success: false, message: 'Server error while creating result', error: error.message });
    }
};

// Update a result
const updateResult = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, exam, rank, score, image, college } = req.body;
        
        const updatedResult = await Result.findByIdAndUpdate(
            id,
            { name, exam, rank, score, image, college },
            { new: true, runValidators: true }
        );
        
        if (!updatedResult) {
            return res.status(404).json({ success: false, message: 'Result not found' });
        }
        
        res.status(200).json({ success: true, message: 'Result updated successfully', data: updatedResult });
    } catch (error) {
        logger.error('Update result error', { stack: error.stack });
        res.status(500).json({ success: false, message: 'Server error while updating result', error: error.message });
    }
};

// Delete a result
const deleteResult = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedResult = await Result.findByIdAndDelete(id);
        
        if (!deletedResult) {
            return res.status(404).json({ success: false, message: 'Result not found' });
        }
        
        res.status(200).json({ success: true, message: 'Result deleted successfully' });
    } catch (error) {
        logger.error('Delete result error', { stack: error.stack });
        res.status(500).json({ success: false, message: 'Server error while deleting result', error: error.message });
    }
};

// Seed default results if collection is empty
const seedInitialResults = async () => {
    try {
        const count = await Result.countDocuments();
        if (count === 0) {
            logger.info('Seeding initial results database...');
            const defaultResults = [
                {
                    name: "Priya Sharma",
                    exam: "JEE Main 2024",
                    rank: "AIR 156",
                    score: "99.8 percentile",
                    image: "https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg?w=150&h=150&fit=crop&crop=face",
                    college: "IIT Delhi - Computer Science"
                },
                {
                    name: "Rahul Kumar",
                    exam: "NEET 2024",
                    rank: "AIR 89",
                    score: "720/720",
                    image: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?w=150&h=150&fit=crop&crop=face",
                    college: "AIIMS Delhi - MBBS"
                },
                {
                    name: "Ananya Patel",
                    exam: "JEE Advanced 2024",
                    rank: "AIR 234",
                    score: "326/360",
                    image: "https://images.pexels.com/photos/3781529/pexels-photo-3781529.jpeg?w=150&h=150&fit=crop&crop=face",
                    college: "IIT Bombay - Electrical Engineering"
                },
                {
                    name: "Arjun Singh",
                    exam: "JEE Main 2024",
                    rank: "AIR 445",
                    score: "99.5 percentile",
                    image: "https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?w=150&h=150&fit=crop&crop=face",
                    college: "IIT Kanpur - Mechanical Engineering"
                },
                {
                    name: "Sneha Reddy",
                    exam: "NEET 2024",
                    rank: "AIR 167",
                    score: "715/720",
                    image: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?w=150&h=150&fit=crop&crop=face",
                    college: "JIPMER - MBBS"
                },
                {
                    name: "Vikash Gupta",
                    exam: "JEE Advanced 2024",
                    rank: "AIR 389",
                    score: "318/360",
                    image: "https://images.pexels.com/photos/3184394/pexels-photo-3184394.jpeg?w=150&h=150&fit=crop&crop=face",
                    college: "IIT Madras - Chemical Engineering"
                }
            ];
            await Result.insertMany(defaultResults);
            logger.info('Seeding initial results completed successfully');
        }
    } catch (error) {
        logger.error('Seeding results error', { stack: error.stack });
    }
};

module.exports = {
    getResults,
    createResult,
    updateResult,
    deleteResult,
    seedInitialResults
};
