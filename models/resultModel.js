const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const resultSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    exam: {
        type: String,
        required: true
    },
    rank: {
        type: String,
        required: true
    },
    score: {
        type: String,
        required: true
    },
    image: {
        type: String,
        default: 'https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg?w=150&h=150&fit=crop&crop=face'
    },
    college: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

const Result = mongoose.model('Result', resultSchema);
module.exports = Result;
