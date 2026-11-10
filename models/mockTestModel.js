const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const questionSchema = new Schema({
    questionText: { 
        type: String, 
        required: [true, 'Question text is required'],
        trim: true 
    },
    options: {
        type: [String],
        required: [true, 'Options are required'],
        validate: {
            validator: function(v) {
                return Array.isArray(v) && v.length >= 2;
            },
            message: 'A question must have at least 2 options'
        }
    },
    correctOption: { 
        type: Number, 
        required: [true, 'Correct option index is required'],
        min: 0
    },
    explanation: { 
        type: String, 
        default: '' 
    },
    marks: { 
        type: Number, 
        default: 1, 
        min: 1 
    }
});

const mockTestSchema = new Schema({
    title: { 
        type: String, 
        required: [true, 'Test title is required'], 
        trim: true 
    },
    subject: { 
        type: String, 
        required: [true, 'Subject is required'], 
        trim: true 
    },
    board: { 
        type: String, 
        default: 'CBSE' 
    },
    grade: { 
        type: String, 
        default: 'Class 10' 
    },
    duration: { 
        type: Number, 
        required: [true, 'Duration in minutes is required'], 
        min: 1, 
        default: 30 
    },
    totalMarks: { 
        type: Number, 
        default: 0 
    },
    passingMarks: { 
        type: Number, 
        default: 0 
    },
    difficulty: { 
        type: String, 
        enum: ['Easy', 'Medium', 'Hard'], 
        default: 'Medium' 
    },
    instructions: { 
        type: String, 
        default: 'Read all questions carefully. Choose the single best answer for each question.' 
    },
    questions: [questionSchema],
    createdBy: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    createdByName: { 
        type: String, 
        default: 'Teacher' 
    },
    createdByRole: { 
        type: String, 
        default: 'teacher' 
    },
    status: { 
        type: String, 
        enum: ['published', 'draft'], 
        default: 'published' 
    }
}, {
    timestamps: true
});

// Calculate total marks and passing marks before saving
mockTestSchema.pre('save', function(next) {
    if (this.questions && this.questions.length > 0) {
        this.totalMarks = this.questions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);
        if (!this.passingMarks || this.passingMarks <= 0) {
            this.passingMarks = Math.ceil(this.totalMarks * 0.35); // 35% passing default
        }
    }
    next();
});

const MockTest = mongoose.model('MockTest', mockTestSchema);
module.exports = MockTest;

