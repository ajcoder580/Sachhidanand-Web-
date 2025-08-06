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
    }
});

const userModel = mongoose.model("User", userSchema);
module.exports = userModel;