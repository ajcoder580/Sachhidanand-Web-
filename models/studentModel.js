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
        fullName: { type: String, required: true,
            minlength: [3, "Full name must be at least 3 characters long"],
            maxlength: [100, "Full name must be less than 50 characters long"],
            required: true,
        },
        fatherName: { type: String, required: true,
            minlength: [3, "Father name must be at least 3 characters long"],
            maxlength: [100, "Father name must be less than 100 characters long"],
            required: true,
        },
        motherName: { type: String, required: true,
            minlength: [3, "Mother name must be at least 3 characters long"],
            maxlength: [100, "Mother name must be less than 100 characters long"],
            required: true,
        },
        dob: { type: Date, required: true },
        gender: { type: String, required: true,
            enum: ['Male', 'Female', 'Other'],
            required: true,
        },
        aadhaarNumber: { type: String, required: true,
            minlength: [12, "Aadhaar number must be 12 characters long"],
            maxlength: [12, "Aadhaar number must be 12 characters long"],
            required: true,
        },
        mobileNumber: { type: String, required: true,
            minlength: [10, "Mobile number must be 10 characters long"],
            maxlength: [10, "Mobile number must be 10 characters long"],
            required: true,
        },
    },
    academicDetails: {
        classApplyingFor: { type: String, required: true },
        previousSchoolName: { type: String, required: true },
        previousClass: { type: String, required: true },
        marksPercentage: { type: String, required: true },
        academicYear: { type: String, required: true }
    },
    documents: {
        studentPhoto: { type: String, required: true,
            maxlength: [1000, "Student photo must be less than 1000 characters long"],
            validate: {
                validator: function(value) {
                    return value.startsWith('https://');
                },
                message: 'Student photo must start with https://'
            }
        },
        aadhaarCard: { type: String, required: true,
            maxlength: [1000, "Aadhaar card must be less than 1000 characters long"],
            validate: {
                validator: function(value) {
                    return value.startsWith('https://');
                },
                message: 'Aadhaar card must start with https://'
            }
        },
        birthCertificate: { type: String, required: true,
            maxlength: [1000, "Birth certificate must be less than 1000 characters long"],
            validate: {
                validator: function(value) {
                    return value.startsWith('https://');
                },
                message: 'Birth certificate must start with https://'
            }
        },
        transferCertificate: { type: String,
            maxlength: [1000, "Transfer certificate must be less than 1000 characters long"],
            validate: {
                validator: function(value) {
                    return value.startsWith('https://');
                },
                message: 'Transfer certificate must start with https://'
            }
        },
        marksheet: { type: String, required: true,
            maxlength: [1000, "Marksheet must be less than 1000 characters long"],
            validate: {
                validator: function(value) {
                    return value.startsWith('https://');
                },
                message: 'Marksheet must start with https://'
            }
        }
    },
    status: {
        type: String,
        enum: ['Pending', 'Under Review', 'Approved', 'Rejected', 'Correction Requested'],
        default: 'Pending'
    },
    correctionReason: {
        type: String,
        required: false,
        maxlength: [1000, "Correction reason must be less than 1000 characters long"],
    },
    rejectionReason: {
        type: String,
        required: false,
        maxlength: [1000, "Rejection reason must be less than 1000 characters long"],
    },
    verificationDate: {
        type: Date
    }
}, {
    timestamps: true
});

const studentModel = mongoose.model('Student', studentSchema);
module.exports = studentModel;
