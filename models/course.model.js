const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const courseSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['School', 'JEE', 'NEET', 'UPSC', 'Navodaya', 'Polytechnic', 'Other'],
        required: true
    },
    classLevel: {
        type: String,
        enum: ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th', 'NA'],
        default: 'NA'
    },
    stream: {
        type: String,
        enum: ['Science', 'Commerce', 'Arts', 'other', 'NA'],
        default: 'NA'
    },
    medium: {
        type: String,
        enum: ['English', 'Hindi', 'NA'],
        default: 'NA'
    },
    description: {
        type: String,
        default: 'NA'
    },
    price: {
        type: Number,
        required: true
    },
    isFree: {
        type: Boolean,
        default: false
    },
    
    durationInMonths: {
        type: Number,
        default: '0'
    },
    syllabus: [
        {
            subject: { type: String },
            topics: [String]
        }
    ],
    createdBy: { // jis teacher/admin ne course banaya
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    teachers: [ // course padhane wale teachers
        { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
});

const courseModel = mongoose.model("Course", courseSchema);
module.exports = courseModel;
