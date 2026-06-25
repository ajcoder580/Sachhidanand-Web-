const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const studentSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    admissionNumber: {
        type: String,
        unique: true,
        sparse: true // Allows it to be null/undefined for pending students, but unique once defined
    },
    personalDetails: {
        fullName: { type: String, required: true },
        fatherName: { type: String, required: true },
        motherName: { type: String, required: true },
        dob: { type: Date, required: true },
        gender: { type: String, required: true },
        aadhaarNumber: { type: String, required: true },
        mobileNumber: { type: String, required: true },
        email: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pinCode: { type: String, required: true }
    },
    academicDetails: {
        classApplyingFor: { type: String, required: true },
        previousSchoolName: { type: String, required: true },
        previousClass: { type: String, required: true },
        marksPercentage: { type: String, required: true },
        academicYear: { type: String, required: true }
    },
    documents: {
        studentPhoto: { type: String, required: true },
        aadhaarCard: { type: String, required: true },
        birthCertificate: { type: String, required: true },
        transferCertificate: { type: String },
        marksheet: { type: String, required: true }
    },
    status: {
        type: String,
        enum: ['Pending', 'Under Review', 'Approved', 'Rejected', 'Correction Requested'],
        default: 'Pending'
    },
    correctionReason: {
        type: String
    },
    rejectionReason: {
        type: String
    },
    verificationDate: {
        type: Date
    }
}, {
    timestamps: true
});

const studentModel = mongoose.model('Student', studentSchema);
module.exports = studentModel;
