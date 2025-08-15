const mongoose  = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    confirmPassword:{
        type:String,
        required:true
    },
    role: {
        type: String,
        enum: ['student','teacher', 'admin'],
        default: 'student'
    },
    city: {
        type: String,
        required: false,
        default: 'NA'

    },
    state: {
        type: String,
        required: false,
        default: 'NA'
    },
    country: {
        type: String,
        required: false,
        default: 'India'
    },
    phone: {
        type: String,
        required: false,
        default: 'NA'
    },
    class: {
        type: String,
        required: false,
        enum: ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th']
    },
    stream: {
        type: String,
        required: false,
        enum: ['Science', 'Commerce', 'Arts','other','NA'],
        default: 'NA'
    },
    medium: {
        type: String,
        required: false,
        enum: ['English', 'Hindi'],
    },
    preparingFor: {
        type: String,
        required: false,
        enum: ['JEE', 'NEET', 'UPSC', 'Navodaya','Polytechnic','other','NA'],
        default: 'NA'
    },
    profilePicture: {
        type: String,
        required: false,
        default: 'null'
    },

});

const userModel = mongoose.model("User", userSchema);
module.exports = userModel;