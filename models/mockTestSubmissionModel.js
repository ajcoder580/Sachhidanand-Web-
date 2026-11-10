const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const answerSchema = new Schema({
    questionId: { 
        type: Schema.Types.ObjectId 
    },
    questionText: { 
        type: String, 
        required: true 
    },
    options: { 
        type: [String], 
        default: [] 
    },
    selectedOption: { 
        type: Number, 
        default: null // null or -1 if unattempted
    },
    correctOption: { 
        type: Number, 
        required: true 
    },
    isCorrect: { 
        type: Boolean, 
        default: false 
    },
    marksObtained: { 
        type: Number, 
        default: 0 
    },
    marksTotal: { 
        type: Number, 
        default: 1 
    },
    explanation: { 
        type: String, 
        default: '' 
    }
});

const mockTestSubmissionSchema = new Schema({
    testId: { 
        type: Schema.Types.ObjectId, 
        ref: 'MockTest', 
        required: true 
    },
    testTitle: { 
        type: String, 
        required: true 
    },
    subject: { 
        type: String, 
        required: true 
    },
    board: { 
        type: String 
    },
    grade: { 
        type: String 
    },
    studentId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    studentName: { 
        type: String, 
        required: true 
    },
    studentEmail: { 
        type: String, 
        required: true 
    },
    answers: [answerSchema],
    totalQuestions: { 
        type: Number, 
        default: 0 
    },
    attemptedCount: { 
        type: Number, 
        default: 0 
    },
    correctCount: { 
        type: Number, 
        default: 0 
    },
    wrongCount: { 
        type: Number, 
        default: 0 
    },
    score: { 
        type: Number, 
        default: 0 
    },
    totalMarks: { 
        type: Number, 
        default: 0 
    },
    percentage: { 
        type: Number, 
        default: 0 
    },
    passed: { 
        type: Boolean, 
        default: false 
    },
    timeSpentSeconds: { 
        type: Number, 
        default: 0 
    },
    submittedAt: { 
        type: Date, 
        default: Date.now 
    }
}, {
    timestamps: true
});

const MockTestSubmission = mongoose.model('MockTestSubmission', mockTestSubmissionSchema);
module.exports = MockTestSubmission;

