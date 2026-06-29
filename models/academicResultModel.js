const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const academicResultSchema = new Schema({
    studentName: {
        type: String,
        required: true,
        trim: true,
        minlength: [3, "Student name must be at least 3 characters long"],
        maxlength: [50, "Student name must be less than 50 characters long"],
    },
    rollCode: {
        type: String,
        required: true,
        trim: true,
        minlength: [3, "Roll code must be at least 3 characters long"],
        maxlength: [20, "Roll code must be less than 20 characters long"],
    },
    rollNumber: {
        type: String,
        required: true,
        trim: true,
        minlength: [3, "Roll number must be at least 3 characters long"],
        maxlength: [20, "Roll number must be less than 20 characters long"],
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
