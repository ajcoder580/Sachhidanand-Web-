const express = require('express');
const router = express.Router();
const { getResults, createResult, updateResult, deleteResult } = require('../controllers/resultController');
const { authenticateToken } = require('../Middleware/authMiddleware');
const authorizeRoles = require('../Middleware/AuthoriseRole');

// GET all results is public
router.get('/', getResults);

// CRUD operations are restricted to admin users only
router.post('/', authenticateToken, authorizeRoles('admin'), createResult);
router.put('/:id', authenticateToken, authorizeRoles('admin'), updateResult);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteResult);

module.exports = router;
