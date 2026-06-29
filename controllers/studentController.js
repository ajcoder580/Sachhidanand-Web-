const Student = require('../models/studentModel');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary if credentials are set in environment
const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                              process.env.CLOUDINARY_API_KEY && 
                              process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
}

// Upload buffer helper for Cloudinary
const uploadBufferToCloudinary = (fileBuffer, folder = 'student_admissions') => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: folder },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result.secure_url);
                }
            }
        );
        stream.end(fileBuffer);
    });
};

// Upload helper for Local storage
const uploadToLocal = (fileBuffer, originalname) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(originalname);
    const filename = uniqueSuffix + ext;
    const uploadsDir = path.join(__dirname, '../uploads');
    
    // Ensure folder exists
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, fileBuffer);
    
    return filename; 
};

// --- API Route Handlers ---

// Upload document
const uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        let fileUrl = '';
        if (isCloudinaryConfigured) {
            fileUrl = await uploadBufferToCloudinary(req.file.buffer);
        } else {
            const filename = uploadToLocal(req.file.buffer, req.file.originalname);
            const protocol = req.protocol;
            const host = req.get('host');
            fileUrl = `${protocol}://${host}/uploads/${filename}`;
        }

        res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            url: fileUrl
        });
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ success: false, message: 'File upload failed', error: error.message });
    }
};

// Student: Submit new admission form
const applyAdmission = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Check if application already exists for this user
        const existing = await Student.findOne({ userId });
        if (existing) {
            return res.status(400).json({ 
                success: false, 
                message: 'You have already submitted an admission application' 
            });
        }

        const { personalDetails, academicDetails, documents } = req.body;

        if (!personalDetails || !academicDetails || !documents) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required admission form fields' 
            });
        }

        const newStudent = new Student({
            userId,
            personalDetails,
            academicDetails,
            documents,
            status: 'Pending'
        });

        await newStudent.save();

        res.status(201).json({
            success: true,
            message: 'Admission application submitted successfully',
            data: newStudent
        });
    } catch (error) {
        console.error('Apply admission error:', error);
        res.status(500).json({ success: false, message: 'Failed to submit application', error: error.message });
    }
};

// Student: Fetch self application
const getMyApplication = async (req, res) => {
    try {
        const userId = req.user.id;
        const application = await Student.findOne({ userId });
        
        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'No admission application found'
            });
        }

        res.status(200).json({
            success: true,
            data: application
        });
    } catch (error) {
        console.error('Get my application error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch application', error: error.message });
    }
};

// Student: Edit own application (Allowed for 'Pending' and 'Correction Requested' status)
const editMyApplication = async (req, res) => {
    try {
        const userId = req.user.id;
        const application = await Student.findOne({ userId });

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'No admission application found'
            });
        }

        if (application.status !== 'Pending' && application.status !== 'Correction Requested') {
            return res.status(400).json({
                success: false,
                message: `Cannot edit application when status is '${application.status}'`
            });
        }

        const { personalDetails, academicDetails, documents } = req.body;

        if (personalDetails) application.personalDetails = personalDetails;
        if (academicDetails) application.academicDetails = academicDetails;
        if (documents) application.documents = documents;

        if (application.status === 'Correction Requested') {
            application.status = 'Pending';
            application.correctionReason = ''; 
        }

        await application.save();

        res.status(200).json({
            success: true,
            message: 'Application updated successfully',
            data: application
        });
    } catch (error) {
        console.error('Edit my application error:', error);
        res.status(500).json({ success: false, message: 'Failed to update application', error: error.message });
    }
};

// Admin: Get applications with pagination & filters (class, status, search)
const adminGetApplications = async (req, res) => {
    try {
        const { classApplyingFor, status, search, page = 1, limit = 10 } = req.query;
        
        const query = {};

        if (classApplyingFor) {
            query['academicDetails.classApplyingFor'] = classApplyingFor;
        }

        if (status) {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { 'personalDetails.fullName': { $regex: search, $options: 'i' } },
                { 'personalDetails.email': { $regex: search, $options: 'i' } },
                { 'personalDetails.mobileNumber': { $regex: search, $options: 'i' } },
                { 'personalDetails.aadhaarNumber': { $regex: search, $options: 'i' } },
                { admissionNumber: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const applications = await Student.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Student.countDocuments(query);

        res.status(200).json({
            success: true,
            data: applications,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Admin get applications error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch applications', error: error.message });
    }
};

// Admin: Get application by ID
const adminGetApplicationById = async (req, res) => {
    try {
        const application = await Student.findById(req.params.id);
        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }
        res.status(200).json({
            success: true,
            data: application
        });
    } catch (error) {
        console.error('Admin get application by ID error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch application', error: error.message });
    }
};

// Admin: Verify application status
const adminUpdateStatus = async (req, res) => {
    try {
        const { status, correctionReason, rejectionReason } = req.body;
        const application = await Student.findById(req.params.id);

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        application.status = status;

        if (status === 'Correction Requested') {
            application.correctionReason = correctionReason || 'Correction required';
            application.rejectionReason = '';
        } else if (status === 'Rejected') {
            application.rejectionReason = rejectionReason || 'Rejected';
            application.correctionReason = '';
        } else if (status === 'Approved') {
            application.correctionReason = '';
            application.rejectionReason = '';
            application.verificationDate = new Date();
            
            // Generate official Admission Number if not set yet
            if (!application.admissionNumber) {
                const year = new Date().getFullYear();
                const rand = Math.floor(1000 + Math.random() * 9000);
                application.admissionNumber = `SCH-${year}-${rand}`;
            }
        } else {
            application.correctionReason = '';
            application.rejectionReason = '';
        }

        await application.save();

        res.status(200).json({
            success: true,
            message: `Application status updated to ${status}`,
            data: application
        });
    } catch (error) {
        console.error('Admin update status error:', error);
        res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
    }
};

// Admin: Update student record (Edit details)
const adminUpdateApplication = async (req, res) => {
    try {
        const { personalDetails, academicDetails, status } = req.body;
        const application = await Student.findById(req.params.id);

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Student application record not found'
            });
        }

        if (personalDetails) {
            application.personalDetails = { ...application.personalDetails, ...personalDetails };
        }
        if (academicDetails) {
            application.academicDetails = { ...application.academicDetails, ...academicDetails };
        }
        if (status) {
            application.status = status;
        }

        await application.save();

        res.status(200).json({
            success: true,
            message: 'Student application record updated successfully',
            data: application
        });
    } catch (error) {
        console.error('Admin edit student record error:', error);
        res.status(500).json({ success: false, message: 'Failed to update student record', error: error.message });
    }
};

// Admin: Delete student record
const adminDeleteApplication = async (req, res) => {
    try {
        const application = await Student.findByIdAndDelete(req.params.id);
        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Student record deleted successfully'
        });
    } catch (error) {
        console.error('Admin delete student record error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete student record', error: error.message });
    }
};

// Admin: Aggregate stats and class-wise lists
const adminGetStats = async (req, res) => {
    try {
        const total = await Student.countDocuments();
        const pending = await Student.countDocuments({ status: 'Pending' });
        const review = await Student.countDocuments({ status: 'Under Review' });
        const approved = await Student.countDocuments({ status: 'Approved' });
        const rejected = await Student.countDocuments({ status: 'Rejected' });
        const correction = await Student.countDocuments({ status: 'Correction Requested' });

        // Approved students by class (Class 1 to Class 10)
        const classes = [
            'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 
            'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'
        ];
        const classCounts = {};
        
        for (const cls of classes) {
            classCounts[cls] = await Student.countDocuments({
                'academicDetails.classApplyingFor': cls,
                status: 'Approved'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                counts: {
                    total,
                    pending,
                    review,
                    approved,
                    rejected,
                    correction
                },
                classCounts
            }
        });
    } catch (error) {
        console.error('Admin get stats error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats', error: error.message });
    }
};

module.exports = {
    uploadDocument,
    applyAdmission,
    getMyApplication,
    editMyApplication,
    adminGetApplications,
    adminGetApplicationById,
    adminUpdateStatus,
    adminUpdateApplication,
    adminDeleteApplication,
    adminGetStats
};
