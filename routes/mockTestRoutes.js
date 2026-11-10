const express = require('express');
const router = express.Router();
const {
    getAllTests,
    getSubjects,
    getTestById,
    createTest,
    updateTest,
    deleteTest,
    submitTest,
    getStudentSubmissions,
    getSubmissionById,
    getTeacherTests,
    getTestSubmissionsForTeacher,
    getLeaderboard
} = require('../controllers/mockTestController');

const { authenticateToken, optionalAuth } = require('../Middleware/authMiddleware');
const authorizeRoles = require('../Middleware/AuthoriseRole');

// 1. Static/Specific Routes (Must precede /:id)
router.get('/', optionalAuth, getAllTests);
router.get('/subjects', getSubjects);
router.get('/leaderboard', getLeaderboard);

// 2. Student Submissions
router.get('/student/my-submissions', authenticateToken, getStudentSubmissions);
router.get('/submissions/:id', authenticateToken, getSubmissionById);

// 3. Teacher Management Routes
router.get('/teacher/my-tests', authenticateToken, authorizeRoles(['teacher', 'admin']), getTeacherTests);
router.get('/teacher/submissions/:testId', authenticateToken, authorizeRoles(['teacher', 'admin']), getTestSubmissionsForTeacher);

// 4. Test Operations
router.post('/', authenticateToken, authorizeRoles(['teacher', 'admin']), createTest);
router.get('/:id', optionalAuth, getTestById);
router.put('/:id', authenticateToken, authorizeRoles(['teacher', 'admin']), updateTest);
router.delete('/:id', authenticateToken, authorizeRoles(['teacher', 'admin']), deleteTest);

// 5. Test Submission (Students / Authenticated Users)
router.post('/:id/submit', authenticateToken, submitTest);

module.exports = router;

