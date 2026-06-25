const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const academicResultSchema = new Schema({
    studentName: {
        type: String,
        required: true,
        trim: true
    },
    rollCode: {
        type: String,
        required: true,
        trim: true
    },
    rollNumber: {
        type: String,
        required: true,
        trim: true
    },
    class: {
        type: String,
        required: true,
        trim: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    marksObtained: {
        type: Number,
        required: true
    },
    totalMarks: {
        type: Number,
        required: true
    },
    percentage: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pass', 'Fail'],
        required: true
    },
    examYear: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true
});

// Ensure rollCode and rollNumber combination has a index to accelerate student query speed
academicResultSchema.index({ rollCode: 1, rollNumber: 1 });

const AcademicResult = mongoose.model('AcademicResult', academicResultSchema);
module.exports = AcademicResult;
